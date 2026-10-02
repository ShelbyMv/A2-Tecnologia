import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { planSchema } from "@/lib/validaciones/clientes";

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

    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al obtener plan" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAuth();
    const { id } = await params;

    const body = await request.json();
    const parse = planSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: parse.data,
    });

    return NextResponse.json(plan);
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { error: e.message || "Error al actualizar plan" },
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

    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.code === "P2003") {
      return NextResponse.json(
        { error: "No se puede eliminar: hay clientes con este plan" },
        { status: 409 },
      );
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { error: e.message || "Error al eliminar plan" },
      { status: 500 },
    );
  }
}