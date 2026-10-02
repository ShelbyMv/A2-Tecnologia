import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { revisionSchema } from "@/lib/validaciones/operaciones";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requiereSesion();
    const { id } = await params;
    const body = await request.json();
    const parse = revisionSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const d = parse.data;

    const revision = await prisma.revision.update({
      where: { id },
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

    return NextResponse.json(revision);
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requiereSesion();
    const { id } = await params;
    await prisma.revision.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
