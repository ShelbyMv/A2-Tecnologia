import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { instalacionSchema } from "@/lib/validaciones/operaciones";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requiereSesion();
    const { id } = await params;
    const body = await request.json();
    const parse = instalacionSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const d = parse.data;

    const instalacion = await prisma.instalacion.update({
      where: { id },
      data: {
        clienteId: d.clienteId,
        fecha: new Date(d.fecha),
        fechaProgramada: d.fechaProgramada ? new Date(d.fechaProgramada) : null,
        fechaCompletada: d.fechaCompletada ? new Date(d.fechaCompletada) : null,
        tipo: d.tipo,
        estado: d.estado,
        zona: d.zona ?? null,
        direccion: d.direccion ?? null,
        referencia: d.referencia ?? null,
        telefono: d.telefono ?? null,
        valorInstalacion: d.valorInstalacion,
        manoObra: d.manoObra,
        routerDesc: d.routerDesc ?? null,
        mac: d.mac ?? null,
        ip: d.ip ?? null,
        longitudCable: d.longitudCable ?? null,
        observacion: d.observacion ?? null,
        recibidoPor: d.recibidoPor ?? null,
      },
    });

    return NextResponse.json(instalacion);
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
    await prisma.instalacion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
