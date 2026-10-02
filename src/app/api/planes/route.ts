import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { planSchema } from "@/lib/validaciones/clientes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requiereSesion();

    const planes = await prisma.plan.findMany({
      orderBy: { valorMensual: "asc" },
    });

    return NextResponse.json(planes);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al obtener planes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requiereSesion();

    const body = await request.json();
    const parse = planSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const plan = await prisma.plan.create({
      data: parse.data,
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al crear plan" },
      { status: 500 },
    );
  }
}