import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { clienteSchema, type ClienteInput } from "@/lib/validaciones/clientes";
import { generarCortes } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requiereSesion();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const estado = searchParams.get("estado");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20"));

    const where: any = {};
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { documento: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
      ];
    }
    if (estado && estado !== "TODOS") {
      where.estado = estado;
    }

    const [items, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { nombre: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { plan: true },
      }),
      prisma.cliente.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al obtener clientes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requiereSesion();

    const body = await request.json();
    const parse = clienteSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parse.data;

    // Si se provee fechaInicioPago, generar los periodos del año actual
    let periodosCreados = 0;
    let periodos: any[] = [];

    if (data.fechaInicioPago && data.valorCuota > 0) {
      const anio = new Date().getFullYear();
      const fechaInicio = new Date(data.fechaInicioPago);
      periodos = generarCortes(anio, data.frecuencia, fechaInicio, data.valorCuota);
    }

    const cliente = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.cliente.create({
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

      if (periodos.length > 0) {
        await tx.periodo.createMany({
          data: periodos.map((p) => ({
            ...p,
            clienteId: nuevo.id,
            saldo: p.monto,
            pagado: 0,
            estado: "FUTURO",
          })),
        });
        periodosCreados = periodos.length;
      }

      return nuevo;
    });

    return NextResponse.json({ ...cliente, periodosCreados }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un cliente con ese documento" }, { status: 409 });
    }
    return NextResponse.json(
      { error: e.message || "Error al crear cliente" },
      { status: 500 },
    );
  }
}