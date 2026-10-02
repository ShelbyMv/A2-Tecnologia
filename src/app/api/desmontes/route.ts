import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { desmonteSchema } from "@/lib/validaciones/operaciones";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requiereSesion();

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const q = searchParams.get("q")?.trim() ?? "";

    const where: any = {};
    if (estado && estado !== "TODOS") where.estado = estado;
    if (q) {
      where.OR = [
        { cliente: { nombre: { contains: q, mode: "insensitive" } } },
        { direccion: { contains: q, mode: "insensitive" } },
      ];
    }

    const items = await prisma.desmonte.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: 200,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        equipos: true,
      },
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requiereSesion();
    const body = await request.json();
    const parse = desmonteSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const d = parse.data;

    const desmonte = await prisma.$transaction(async (tx) => {
      const creado = await tx.desmonte.create({
        data: {
          clienteId: d.clienteId,
          fecha: new Date(d.fecha),
          motivo: d.motivo,
          estado: d.estado,
          direccion: d.direccion ?? null,
          zona: d.zona ?? null,
          routerDesc: d.routerDesc ?? null,
          mac: d.mac ?? null,
          saldoFavor: d.saldoFavor,
          valorEquipos: d.valorEquipos,
          observacion: d.observacion ?? null,
          tecnico: d.tecnico ?? null,
        },
      });

      if (d.equipos && d.equipos.length > 0) {
        await tx.equipoRetirado.createMany({
          data: d.equipos.map((eq) => ({
            desmonteId: creado.id,
            tipo: eq.tipo,
            marca: eq.marca ?? null,
            modelo: eq.modelo ?? null,
            mac: eq.mac ?? null,
            estado: eq.estado,
            valor: eq.valor,
            nota: eq.nota ?? null,
          })),
        });
      }

      // Si el desmonte queda completado, marcar el cliente como DESMONTADO.
      if (d.estado === "COMPLETADA") {
        await tx.cliente.update({
          where: { id: d.clienteId },
          data: { estado: "DESMONTADO" },
        });
      }

      return creado;
    });

    return NextResponse.json(desmonte, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
