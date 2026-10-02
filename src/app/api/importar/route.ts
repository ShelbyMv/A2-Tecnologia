import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { generarCortes } from "@/lib/fechas";

export const dynamic = "force-dynamic";

type FilaImportada = {
  nombre?: string;
  documento?: string;
  telefono?: string;
  direccion?: string;
  zona?: string;
  barrio?: string;
  email?: string;
  plan?: string;
  frecuencia?: string;
  valorCuota?: number | string;
  ip?: string;
  mac?: string;
  equipo?: string;
  fechaInstalacion?: string;
  fechaInicioPago?: string;
  estado?: string;
};

const MESES: Record<string, number> = {
  ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3,
  may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7,
  sep: 8, sept: 8, septiembre: 8, oct: 9, octubre: 9, nov: 10, noviembre: 10,
  dic: 11, diciembre: 11,
};

/** Interpreta fechas de Excel: Date serial, "dd/mm/yyyy", "yyyy-mm-dd", "12 Ene 2026". */
function interpretarFecha(valor: unknown): Date | null {
  if (!valor) return null;

  if (valor instanceof Date) return valor;

  if (typeof valor === "number") {
    // Serial de Excel: días desde 1899-12-30.
    const ms = Math.round((valor - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  const texto = String(valor).trim().toLowerCase();
  if (!texto) return null;

  // yyyy-mm-dd
  let m = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // dd/mm/yyyy o dd-mm-yyyy
  m = texto.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) {
    const anio = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return new Date(anio, +m[2] - 1, +m[1]);
  }

  // "12 ene 2026" o "12 de enero de 2026"
  m = texto.match(/(\d{1,2})\s+(?:de\s+)?([a-záéíóú]+)\s+(?:de\s+)?(\d{4})/);
  if (m && MESES[m[2]] !== undefined) {
    return new Date(+m[3], MESES[m[2]], +m[1]);
  }

  return null;
}

function interpretarFrecuencia(valor: unknown): "MENSUAL" | "QUINCENAL" {
  const t = String(valor ?? "").trim().toLowerCase();
  if (t.startsWith("quin") || t.startsWith("q")) return "QUINCENAL";
  return "MENSUAL";
}

function interpretarEstado(valor: unknown): string {
  const t = String(valor ?? "").trim().toUpperCase();
  if (["ACTIVO", "SUSPENDIDO", "INACTIVO", "DESMONTADO"].includes(t)) return t;
  return "ACTIVO";
}

function parseNumero(valor: unknown): number {
  if (typeof valor === "number") return Math.round(valor);
  if (!valor) return 0;
  const limpio = String(valor).replace(/[^\d]/g, "");
  const n = parseInt(limpio, 10);
  return isNaN(n) ? 0 : n;
}

export async function POST(request: Request) {
  try {
    await requiereSesion();

    const { filas, generarPeriodos } = await request.json();
    if (!Array.isArray(filas) || filas.length === 0) {
      return NextResponse.json({ error: "No hay filas para importar" }, { status: 400 });
    }

    const config = await prisma.config.findUnique({ where: { id: 1 } });
    const planes = await prisma.plan.findMany();
    const planPorNombre = new Map(
      planes.map((p) => [p.nombre.toLowerCase().replace(/\s+/g, " "), p]),
    );

    let creados = 0;
    let actualizados = 0;
    let periodosCreados = 0;
    const errores: { fila: number; nombre?: string; error: string }[] = [];

    for (let i = 0; i < filas.length; i++) {
      const f: FilaImportada = filas[i];

      try {
        const nombre = String(f.nombre ?? "").trim();
        if (!nombre) {
          errores.push({ fila: i + 2, error: "Sin nombre" });
          continue;
        }

        const frecuencia = interpretarFrecuencia(f.frecuencia);
        const valorCuota = parseNumero(f.valorCuota);

        // Buscar plan por nombre (o el que coincida parcialmente).
        let planId: string | null = null;
        const nombrePlan = String(f.plan ?? "").trim().toLowerCase().replace(/\s+/g, " ");
        if (nombrePlan) {
          const exacto = planPorNombre.get(nombrePlan);
          if (exacto) planId = exacto.id;
          else {
            const parcial = planes.find((p) =>
              p.nombre.toLowerCase().includes(nombrePlan) ||
              nombrePlan.includes(p.nombre.toLowerCase()),
            );
            if (parcial) planId = parcial.id;
          }
        }

        // Si no hay cuota pero hay plan, usar la del plan.
        const cuotaFinal = valorCuota > 0 ? valorCuota : planPorNombre.get(nombrePlan)?.valorMensual ?? 0;

        const fechaInst = interpretarFecha(f.fechaInstalacion);
        const fechaInicio = interpretarFecha(f.fechaInicioPago) ?? fechaInst;

        const existente = await prisma.cliente.findFirst({
          where: {
            OR: [
              ...(f.documento ? [{ documento: String(f.documento).trim() }] : []),
              { nombre: { equals: nombre, mode: "insensitive" } },
            ],
          },
        });

        const datos = {
          nombre,
          documento: f.documento ? String(f.documento).trim() : null,
          telefono: f.telefono ? String(f.telefono).trim() : null,
          direccion: f.direccion ? String(f.direccion).trim() : null,
          zona: f.zona ? String(f.zona).trim() : null,
          barrio: f.barrio ? String(f.barrio).trim() : null,
          email: f.email ? String(f.email).trim() : null,
          planId,
          frecuencia,
          valorCuota: cuotaFinal,
          ip: f.ip ? String(f.ip).trim() : null,
          mac: f.mac ? String(f.mac).trim() : null,
          equipoDesc: f.equipo ? String(f.equipo).trim() : null,
          fechaInstalacion: fechaInst,
          fechaActivacion: fechaInst,
          fechaInicioPago: fechaInicio,
          estado: interpretarEstado(f.estado) as any,
        };

        let clienteId: string;

        if (existente) {
          await prisma.cliente.update({ where: { id: existente.id }, data: datos });
          clienteId = existente.id;
          actualizados++;
        } else {
          const nuevo = await prisma.cliente.create({ data: datos });
          clienteId = nuevo.id;
          creados++;
        }

        // Generar cortes del año en curso a partir de la fecha de inicio de pago.
        if (generarPeriodos && fechaInicio && cuotaFinal > 0) {
          const anio = new Date().getFullYear();
          const yaTiene = await prisma.periodo.count({
            where: { clienteId, anio },
          });
          if (yaTiene === 0) {
            const cortes = generarCortes(anio, frecuencia, fechaInicio, cuotaFinal);
            const hoy = new Date();
            await prisma.periodo.createMany({
              data: cortes.map((c) => ({
                clienteId,
                codigo: c.codigo,
                numero: c.numero,
                anio: c.anio,
                quincena: c.quincena,
                fechaInicio: c.fechaInicio,
                fechaVencimiento: c.fechaVencimiento,
                monto: c.monto,
                pagado: 0,
                saldo: c.monto,
                estado: c.fechaVencimiento < hoy ? "ATRASADO" : "FUTURO",
              })),
            });
            periodosCreados += cortes.length;
          }
        }
      } catch (e: any) {
        errores.push({ fila: i + 2, nombre: f.nombre, error: e.message ?? "Error" });
      }
    }

    return NextResponse.json({
      ok: true,
      creados,
      actualizados,
      periodosCreados,
      errores,
      total: filas.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al importar" }, { status: 500 });
  }
}
