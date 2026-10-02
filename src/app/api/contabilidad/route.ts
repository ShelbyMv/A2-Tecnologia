import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { rangoAnio } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requiereSesion();

    const { searchParams } = new URL(request.url);
    const anio = parseInt(searchParams.get("anio") || String(new Date().getFullYear()));
    const { desde, hasta } = rangoAnio(anio);

    // Transacciones del año
    const transacciones = await prisma.transaccion.findMany({
      where: { fecha: { gte: desde, lte: hasta } },
      orderBy: { fecha: "desc" },
      include: {
        categoria: true,
        cliente: { select: { id: true, nombre: true } },
      },
    });

    // Totales
    const ingresos = transacciones
      .filter((t) => t.tipo === "INGRESO")
      .reduce((s, t) => s + t.monto, 0);
    const egresos = transacciones
      .filter((t) => t.tipo === "EGRESO")
      .reduce((s, t) => s + t.monto, 0);

    // Desglose del reparto de ingresos (empresa vs dueño)
    const montoEmpresaIngresos = transacciones
      .filter((t) => t.tipo === "INGRESO")
      .reduce((s, t) => s + t.montoEmpresa, 0);
    const montoDuenoIngresos = transacciones
      .filter((t) => t.tipo === "INGRESO")
      .reduce((s, t) => s + t.montoDueno, 0);

    // Ganancia neta = ingresos - egresos
    const gananciaNeta = ingresos - egresos;

    // Serie mensual para las gráficas
    const meses = Array.from({ length: 12 }, (_, i) => {
      const delMes = transacciones.filter((t) => t.fecha.getMonth() === i);
      const ing = delMes.filter((t) => t.tipo === "INGRESO").reduce((s, t) => s + t.monto, 0);
      const egr = delMes.filter((t) => t.tipo === "EGRESO").reduce((s, t) => s + t.monto, 0);
      const empresa = delMes.filter((t) => t.tipo === "INGRESO").reduce((s, t) => s + t.montoEmpresa, 0);
      return {
        mes: i,
        etiqueta: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][i],
        ingresos: ing,
        egresos: egr,
        ganancia: ing - egr,
        empresa,
        dueno: ing - egr - empresa,
      };
    });

    // Egresos por categoría (gráfica circular)
    const egresosPorCategoria = Object.values(
      transacciones
        .filter((t) => t.tipo === "EGRESO")
        .reduce<Record<string, { nombre: string; monto: number; color: string }>>((acc, t) => {
          const key = t.categoriaId;
          if (!acc[key]) {
            acc[key] = { nombre: t.categoria.nombre, monto: 0, color: t.categoria.color };
          }
          acc[key].monto += t.monto;
          return acc;
        }, {}),
    ).sort((a, b) => b.monto - a.monto);

    // Ingresos por categoría
    const ingresosPorCategoria = Object.values(
      transacciones
        .filter((t) => t.tipo === "INGRESO")
        .reduce<Record<string, { nombre: string; monto: number; color: string }>>((acc, t) => {
          const key = t.categoriaId;
          if (!acc[key]) {
            acc[key] = { nombre: t.categoria.nombre, monto: 0, color: t.categoria.color };
          }
          acc[key].monto += t.monto;
          return acc;
        }, {}),
    ).sort((a, b) => b.monto - a.monto);

    // Cartera por antigüedad (aging)
    const hoy = new Date();
    const carteraPeriodos = await prisma.periodo.findMany({
      where: { estado: { in: ["ATRASADO", "PENDIENTE", "PARCIAL"] } },
      select: { saldo: true, fechaVencimiento: true },
    });

    const cartera = { total: 0, d0a30: 0, d31a60: 0, d61a90: 0, mas90: 0, porVencer: 0 };
    for (const p of carteraPeriodos) {
      cartera.total += p.saldo;
      const dias = Math.floor((hoy.getTime() - p.fechaVencimiento.getTime()) / 86400000);
      if (dias < 0) cartera.porVencer += p.saldo;
      else if (dias <= 30) cartera.d0a30 += p.saldo;
      else if (dias <= 60) cartera.d31a60 += p.saldo;
      else if (dias <= 90) cartera.d61a90 += p.saldo;
      else cartera.mas90 += p.saldo;
    }

    return NextResponse.json({
      anio,
      totales: { ingresos, egresos, gananciaNeta, montoEmpresaIngresos, montoDuenoIngresos },
      meses,
      egresosPorCategoria,
      ingresosPorCategoria,
      cartera,
      transacciones: transacciones.slice(0, 100),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
