import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { instalacionSchema } from "@/lib/validaciones/operaciones";

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
        { zona: { contains: q, mode: "insensitive" } },
      ];
    }

    const items = await prisma.instalacion.findMany({
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
    const parse = instalacionSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const d = parse.data;

    const instalacion = await prisma.instalacion.create({
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

    return NextResponse.json(instalacion, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
