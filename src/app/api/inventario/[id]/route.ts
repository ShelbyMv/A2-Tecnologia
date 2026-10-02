import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requiereSesion();
    const { id } = await params;
    const d = await request.json();

    const item = await prisma.itemInventario.update({
      where: { id },
      data: {
        nombre: d.nombre,
        categoriaId: d.categoriaId,
        codigo: d.codigo || null,
        marca: d.marca || null,
        modelo: d.modelo || null,
        descripcion: d.descripcion || null,
        ubicacion: d.ubicacion || null,
        stockMinimo: Number(d.stockMinimo) || 0,
        unidad: d.unidad ?? "UNIDAD",
        costoUnitario: Number(d.costoUnitario) || 0,
        precioVenta: Number(d.precioVenta) || 0,
        proveedor: d.proveedor || null,
        // El stock no se edita directo: sólo por movimientos.
      },
    });

    return NextResponse.json(item);
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
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
    // Soft delete: no borra para conservar el historial.
    await prisma.itemInventario.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
