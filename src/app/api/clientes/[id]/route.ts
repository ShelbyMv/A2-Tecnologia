import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { clienteSchema } from "@/lib/validaciones/clientes";
import { generarCortes } from "@/lib/fechas";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const sesion = await requiereSesion();
  return sesion;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth();
    const { id } = await params;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        plan: true,
        periodos: { orderBy: [{ anio: "desc" }, { numero: "desc" }] },
        pagos: { orderBy: { fecha: "desc" }, take: 10 },
        instalaciones: { orderBy: { fecha: "desc" } },
        revisiones: { orderBy: { fecha: "desc" } },
        desmontes: { orderBy: { fecha: "desc" } },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al obtener cliente" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth();
    const { id } = await params;

    const body = await request.json();
    const parse = clienteSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parse.data;

    // Obtener cliente actual para comparar valorCuota y fechaInicioPago
    const actual = await prisma.cliente.findUnique({ where: { id } });
    if (!actual) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const valorCuotaCambio = data.valorCuota !== actual.valorCuota;
    const fechaInicioCambio = data.fechaInicioPago !== actual.fechaInicioPago?.toISOString().split("T")[0];

    // Si cambió la cuota o la fecha de inicio, regenerar periodos futuros
    let periodosRegenerados = 0;

    const cliente = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.cliente.update({
        where: { id },
        data: {
          nombre: data.nombre,
          documento: data.documento ?? null,
          telefono: data.telefono ?? null,
          direccion: data.direccion ?? null,
          zona: data.zona ?? null,
          barrio: data.barrio ?? null,
          email: data.email ?? null,
          planId: data.planId ?? null,
          frecuencia: data.frecuencia,
          valorCuota: data.valorCuota,
          ip: data.ip ?? null,
          mac: data.mac ?? null,
          equipoDesc: data.equipoDesc ?? null,
          fechaInstalacion: data.fechaInstalacion ? new Date(data.fechaInstalacion) : null,
          fechaActivacion: data.fechaActivacion ? new Date(data.fechaActivacion) : null,
          fechaInicioPago: data.fechaInicioPago ? new Date(data.fechaInicioPago) : null,
          estado: data.estado,
          notas: data.notas ?? null,
        },
      });

      // Regenerar periodos pendientes si cambió la cuota o fecha de inicio
      if ((valorCuotaCambio || fechaInicioCambio) && data.fechaInicioPago && data.valorCuota > 0) {
        const anio = new Date().getFullYear();
        const fechaInicio = new Date(data.fechaInicioPago);
        const nuevosCortes = generarCortes(anio, data.frecuencia, fechaInicio, data.valorCuota);

        // Borrar periodos futuros y pendientes (no pagados)
        await tx.periodo.deleteMany({
          where: {
            clienteId: id,
            estado: { in: ["FUTURO", "PENDIENTE"] },
          },
        });

        // Crear nuevos periodos
        await tx.periodo.createMany({
          data: nuevosCortes.map((p) => ({
            ...p,
            clienteId: id,
            saldo: p.monto,
            pagado: 0,
            estado: p.fechaVencimiento < new Date() ? "ATRASADO" : "FUTURO",
          })),
        });
        periodosRegenerados = nuevosCortes.length;
      }

      return actualizado;
    });

    return NextResponse.json({ ...cliente, periodosRegenerados });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un cliente con ese documento" }, { status: 409 });
    }
    return NextResponse.json(
      { error: e.message || "Error al actualizar cliente" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth();
    const { id } = await params;

    await prisma.cliente.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.code === "P2003") {
      return NextResponse.json(
        { error: "No se puede eliminar: tiene registros asociados" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e.message || "Error al eliminar cliente" },
      { status: 500 },
    );
  }
}