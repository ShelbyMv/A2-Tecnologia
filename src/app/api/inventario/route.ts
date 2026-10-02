import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requiereSesion();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const categoriaId = searchParams.get("categoriaId");
    const soloBajoStock = searchParams.get("bajoStock") === "1";

    const where: any = { activo: true };
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { codigo: { contains: q, mode: "insensitive" } },
        { marca: { contains: q, mode: "insensitive" } },
      ];
    }
    if (categoriaId && categoriaId !== "TODAS") where.categoriaId = categoriaId;

    const items = await prisma.itemInventario.findMany({
      where,
      orderBy: { nombre: "asc" },
      include: { categoria: true },
    });

    const filtrados = soloBajoStock
      ? items.filter((i) => i.stock <= i.stockMinimo)
      : items;

    const valorTotal = filtrados.reduce((s, i) => s + i.stock * i.costoUnitario, 0);
    const bajoStock = items.filter((i) => i.stock <= i.stockMinimo).length;

    const categorias = await prisma.categoriaInventario.findMany({
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({
      items: filtrados,
      categorias,
      resumen: { valorTotal, bajoStock, totalItems: items.length },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requiereSesion();
    const d = await request.json();

    if (!d.nombre || !d.categoriaId) {
      return NextResponse.json({ error: "Nombre y categoría requeridos" }, { status: 400 });
    }

    const item = await prisma.$transaction(async (tx) => {
      const creado = await tx.itemInventario.create({
        data: {
          nombre: d.nombre,
          categoriaId: d.categoriaId,
          codigo: d.codigo || null,
          marca: d.marca || null,
          modelo: d.modelo || null,
          descripcion: d.descripcion || null,
          ubicacion: d.ubicacion || null,
          stock: Number(d.stock) || 0,
          stockMinimo: Number(d.stockMinimo) || 0,
          unidad: d.unidad ?? "UNIDAD",
          costoUnitario: Number(d.costoUnitario) || 0,
          precioVenta: Number(d.precioVenta) || 0,
          proveedor: d.proveedor || null,
        },
      });

      const stockInicial = Number(d.stock) || 0;
      if (stockInicial > 0) {
        await tx.movimientoInventario.create({
          data: {
            itemId: creado.id,
            tipo: "ENTRADA",
            origen: "COMPRA",
            cantidad: stockInicial,
            delta: stockInicial,
            costoUnitario: Number(d.costoUnitario) || 0,
            total: Math.round(stockInicial * (Number(d.costoUnitario) || 0)),
            stockResultante: stockInicial,
            motivo: "Stock inicial del item",
          },
        });
      }

      return creado;
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un item con ese código" }, { status: 409 });
    }
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
