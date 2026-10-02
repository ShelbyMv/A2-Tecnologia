import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

async function checkAuth() {
  return await requiereSesion();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth();
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

    return NextResponse.json(pago);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al obtener pago" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth();
    const { id } = await params;

    // Obtener el pago con sus aplicaciones
    const pago = await prisma.pago.findUnique({
      where: { id },
      include: { aplicaciones: { include: { periodo: true } } },
    });

    if (!pago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    if (pago.anulado) {
      return NextResponse.json({ error: "El pago ya está anulado" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Revertir periodos
      for (const app of pago.aplicaciones) {
        const periodo = await tx.periodo.findUnique({
          where: { id: app.periodoId },
        });
        if (!periodo) continue;

        const nuevoPagado = Math.max(0, periodo.pagado - app.monto);
        const nuevoSaldo = periodo.monto - nuevoPagado;

        let nuevoEstado: string = "PENDIENTE";
        if (nuevoSaldo === 0) nuevoEstado = "PAGADO";
        else if (nuevoPagado > 0) nuevoEstado = "PARCIAL";
        else if (periodo.fechaVencimiento < new Date()) nuevoEstado = "ATRASADO";
        else nuevoEstado = "FUTURO";

        await tx.periodo.update({
          where: { id: app.periodoId },
          data: {
            pagado: nuevoPagado,
            saldo: nuevoSaldo,
            estado: nuevoEstado as any,
            fechaPago: nuevoEstado === "PAGADO" ? periodo.fechaPago : null,
          },
        });
      }

      // Anular transacción contable
      await tx.transaccion.updateMany({
        where: { pagoId: id },
        data: { observacion: "ANULADO: " + (pago.nota ?? "") },
      });

      // Marcar pago como anulado
      await tx.pago.update({
        where: { id },
        data: {
          anulado: true,
          anuladoMotivo: "Anulado por usuario",
          anuladoEn: new Date(),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al anular pago" },
      { status: 500 },
    );
  }
}