import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { revisionSchema } from "@/lib/validaciones/operaciones";

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
        { motivo: { contains: q, mode: "insensitive" } },
      ];
    }

    const items = await prisma.revision.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: 200,
      include: { cliente: { select: { id: true, nombre: true, telefono: true } } },
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
    const parse = revisionSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const d = parse.data;

    const revision = await prisma.revision.create({
      data: {
        clienteId: d.clienteId,
        fecha: new Date(d.fecha),
        tipo: d.tipo,
        estado: d.estado,
        motivo: d.motivo ?? null,
        diagnostico: d.diagnostico ?? null,
        solucion: d.solucion ?? null,
        duracionMin: d.duracionMin ?? null,
        senalDbm: d.senalDbm ?? null,
        velocidadBajada: d.velocidadBajada ?? null,
        velocidadSubida: d.velocidadSubida ?? null,
        valorCobrado: d.valorCobrado,
        proximaRevision: d.proximaRevision ? new Date(d.proximaRevision) : null,
        observacion: d.observacion ?? null,
        tecnico: d.tecnico ?? null,
      },
    });

    return NextResponse.json(revision, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
