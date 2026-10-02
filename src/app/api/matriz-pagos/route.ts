import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requiereSesion();

    const { searchParams } = new URL(request.url);
    const anio = parseInt(searchParams.get("anio") || String(new Date().getFullYear()));
    const vista = searchParams.get("vista") || "MENSUAL"; // MENSUAL | QUINCENAL

    // Obtener clientes activos con sus periodos del año
    const clientes = await prisma.cliente.findMany({
      where: {
        estado: { in: ["ACTIVO", "SUSPENDIDO"] },
      },
      orderBy: { nombre: "asc" },
      include: {
        periodos: {
          where: { anio },
          orderBy: { numero: "asc" },
        },
        plan: true,
      },
    });

    // Generar columnas según vista
    const columnas = vista === "QUINCENAL"
      ? Array.from({ length: 24 }, (_, i) => {
          const mes = i % 12;
          const q = (i % 2) + 1;
          return {
            key: `${anio}-${String(mes + 1).padStart(2, "0")}-Q${q}`,
            label: `${["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][mes]} Q${q}`,
            mes,
            quincena: q,
          };
        })
      : Array.from({ length: 12 }, (_, i) => ({
          key: `${anio}-${String(i + 1).padStart(2, "0")}`,
          label: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][i],
          mes: i,
          quincena: null,
        }));

    // Mapear periodos por código para búsqueda rápida
    const filas = clientes.map((cliente) => {
      const periodosMap = new Map(
        cliente.periodos.map((p) => [p.codigo, p]),
      );

      const celdas = columnas.map((col) => {
        const periodo = periodosMap.get(col.key);
        if (!periodo) {
          return { codigo: col.key, estado: "FUTURO", monto: 0, pagado: 0, saldo: 0 };
        }
        return {
          codigo: col.key,
          estado: periodo.estado,
          monto: periodo.monto,
          pagado: periodo.pagado,
          saldo: periodo.saldo,
          periodoId: periodo.id,
        };
      });

      // Resumen del cliente
      const totalPendiente = celdas
        .filter((c) => ["PENDIENTE", "ATRASADO", "PARCIAL"].includes(c.estado))
        .reduce((s, c) => s + c.saldo, 0);
      const totalPagado = celdas
        .filter((c) => c.estado === "PAGADO")
        .reduce((s, c) => s + c.pagado, 0);

      return {
        id: cliente.id,
        nombre: cliente.nombre,
        documento: cliente.documento,
        telefono: cliente.telefono,
        zona: cliente.zona,
        plan: cliente.plan?.nombre ?? "Sin plan",
        frecuencia: cliente.frecuencia,
        valorCuota: cliente.valorCuota,
        estado: cliente.estado,
        celdas,
        totalPendiente,
        totalPagado,
      };
    });

    // Totales generales
    const totalPendiente = filas.reduce((s, f) => s + f.totalPendiente, 0);
    const totalPagado = filas.reduce((s, f) => s + f.totalPagado, 0);

    return NextResponse.json({
      anio,
      vista,
      columnas,
      filas,
      resumen: {
        totalPendiente,
        totalPagado,
        totalClientes: filas.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al generar matriz" },
      { status: 500 },
    );
  }
}