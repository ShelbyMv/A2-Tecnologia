import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requiereSesion();
    let config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config) {
      config = await prisma.config.create({ data: { id: 1 } });
    }
    return NextResponse.json(config);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requiereSesion();
    const d = await request.json();

    const config = await prisma.config.upsert({
      where: { id: 1 },
      update: {
        nombreEmpresa: d.nombreEmpresa,
        nit: d.nit || null,
        telefono: d.telefono || null,
        direccion: d.direccion || null,
        email: d.email || null,
        montoEmpresa: Number(d.montoEmpresa) || 0,
        conceptoEmpresa: d.conceptoEmpresa || "Parte empresa",
        conceptoDueno: d.conceptoDueno || "Ganancia del dueño",
        diasGracia: Number(d.diasGracia) || 5,
      },
      create: {
        id: 1,
        nombreEmpresa: d.nombreEmpresa ?? "A2 Tecnología",
        nit: d.nit || null,
        telefono: d.telefono || null,
        direccion: d.direccion || null,
        email: d.email || null,
        montoEmpresa: Number(d.montoEmpresa) || 40000,
        conceptoEmpresa: d.conceptoEmpresa || "Parte empresa",
        conceptoDueno: d.conceptoDueno || "Ganancia del dueño",
        diasGracia: Number(d.diasGracia) || 5,
      },
    });

    return NextResponse.json(config);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
