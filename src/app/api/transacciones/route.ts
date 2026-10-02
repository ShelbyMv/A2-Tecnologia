import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requiereSesion();
    const { fecha, tipo, categoriaId, concepto, monto, metodo, observacion } =
      await request.json();

    if (!fecha || !tipo || !categoriaId || !concepto || !monto) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    const transaccion = await prisma.transaccion.create({
      data: {
        fecha: new Date(fecha),
        tipo,
        categoriaId,
        concepto,
        monto: Number(monto),
        metodo: metodo ?? null,
        observacion: observacion ?? null,
        automatica: false,
      },
    });

    return NextResponse.json(transaccion, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
