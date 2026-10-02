import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requiereSesion();
    const categorias = await prisma.categoriaTransaccion.findMany({
      where: { activo: true },
      orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
    });
    return NextResponse.json(categorias);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requiereSesion();
    const { nombre, tipo, color } = await request.json();
    if (!nombre || !tipo) {
      return NextResponse.json({ error: "Nombre y tipo requeridos" }, { status: 400 });
    }
    const categoria = await prisma.categoriaTransaccion.create({
      data: { nombre, tipo, color: color ?? "#64748b" },
    });
    return NextResponse.json(categoria, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe esa categoría" }, { status: 409 });
    }
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
