import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requiereSesion();
    const { id } = await params;

    const pago = await prisma.pago.findUnique({
      where: { id },
      include: {
        cliente: true,
        aplicaciones: { include: { periodo: true } },
      },
    });

    if (!pago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const config = await prisma.config.findUnique({ where: { id: 1 } });

    return NextResponse.json({ pago, config });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
