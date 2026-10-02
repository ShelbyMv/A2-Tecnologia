import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/** Historial de movimientos de un item. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requiereSesion();
    const { id } = await params;

    const movimientos = await prisma.movimientoInventario.findMany({
      where: { itemId: id },
      orderBy: { fecha: "desc" },
      take: 100,
    });

    return NextResponse.json({ items: movimientos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}

/** Registrar un movimiento (entrada, salida, ajuste, devolución). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requiereSesion();
    const { id } = await params;
    const d = await request.json();

    const tipo = d.tipo as "ENTRADA" | "SALIDA" | "AJUSTE" | "DEVOLUCION";
    if (!["ENTRADA", "SALIDA", "AJUSTE", "DEVOLUCION"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo de movimiento inválido" }, { status: 400 });
    }

    const cantidad = Number(d.cantidad);
    if (!cantidad || cantidad <= 0) {
      return NextResponse.json({ error: "Cantidad debe ser mayor a 0" }, { status: 400 });
    }

    const item = await prisma.itemInventario.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
    }

    // Calcular el delta según el tipo de movimiento.
    let delta = 0;
    if (tipo === "ENTRADA") delta = cantidad;
    else if (tipo === "SALIDA") delta = -cantidad;
    else if (tipo === "DEVOLUCION") delta = cantidad;
    else if (tipo === "AJUSTE") delta = cantidad - item.stock; // cantidad = stock final

    const nuevoStock = item.stock + delta;
    if (nuevoStock < 0) {
      return NextResponse.json(
        { error: `Stock insuficiente: hay ${item.stock} ${item.unidad.toLowerCase()}(s)` },
        { status: 409 },
      );
    }

    const costoUnitario = Number(d.costoUnitario) || item.costoUnitario;

    const resultado = await prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimientoInventario.create({
        data: {
          itemId: id,
          tipo,
          origen: d.origen ?? "MANUAL",
          cantidad,
          delta,
          costoUnitario,
          total: Math.round(Math.abs(delta) * costoUnitario),
          stockResultante: nuevoStock,
          motivo: d.motivo || null,
          nota: d.nota || null,
        },
      });

      await tx.itemInventario.update({
        where: { id },
        data: {
          stock: nuevoStock,
          // Si es una compra, actualizar el costo unitario.
          ...(tipo === "ENTRADA" && d.origen === "COMPRA" && Number(d.costoUnitario) > 0
            ? { costoUnitario: Number(d.costoUnitario) }
            : {}),
        },
      });

      return movimiento;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
