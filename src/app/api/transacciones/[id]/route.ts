import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requiereSesion();
    const { id } = await params;

    const transaccion = await prisma.transaccion.findUnique({ where: { id } });
    if (!transaccion) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    if (transaccion.automatica && transaccion.pagoId) {
      return NextResponse.json(
        {
          error:
            "Esta transacción viene de un pago automático. Anula el pago desde el módulo de Pagos.",
        },
        { status: 409 },
      );
    }

    await prisma.transaccion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
