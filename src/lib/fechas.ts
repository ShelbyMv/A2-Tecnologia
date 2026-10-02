// ============================================================================
//  Helpers de fechas y cortes de facturación
// ============================================================================

export const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Normaliza cualquier fecha a medianoche local, para comparar solo el día. */
export function soloFecha(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function hoy(): Date {
  return soloFecha(new Date());
}

/** "2026-01" para mensual. */
export function codigoMensual(anio: number, mes: number): string {
  return `${anio}-${String(mes + 1).padStart(2, "0")}`;
}

/** "2026-01-Q1" para quincenal. */
export function codigoQuincenal(anio: number, mes: number, quincena: number): string {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-Q${quincena}`;
}

/** Etiqueta legible de un mes: "Ene 2026". */
export function etiquetaMes(anio: number, mes: number): string {
  return `${MESES_CORTOS[mes]} ${anio}`;
}

/**
 * Genera los cortes de facturación de un cliente.
 * - MENSUAL  -> 12 periodos (uno por mes)
 * - QUINCENAL -> 24 periodos (dos por mes)
 *
 * Devuelve un objeto por cada periodo con su código, fechas y monto.
 */
export function generarCortes(
  anio: number,
  frecuencia: "MENSUAL" | "QUINCENAL",
  fechaInicio: Date,
  valorCuota: number,
) {
  const cortes: {
    codigo: string;
    numero: number;
    anio: number;
    quincena: number | null;
    fechaInicio: Date;
    fechaVencimiento: Date;
    monto: number;
  }[] = [];

  const inicio = soloFecha(fechaInicio);
  const mesInicio = inicio.getMonth();
  const diaVencimiento = inicio.getDate();

  if (frecuencia === "MENSUAL") {
    for (let i = 0; i < 12; i++) {
      const mes = (mesInicio + i) % 12;
      const anioCorte = anio + Math.floor((mesInicio + i) / 12);
      const fechaInicioCorte = new Date(anioCorte, mes, 1);
      const ultimoDia = new Date(anioCorte, mes + 1, 0).getDate();
      const dia = Math.min(diaVencimiento, ultimoDia);
      const fechaVence = new Date(anioCorte, mes, dia);

      cortes.push({
        codigo: codigoMensual(anioCorte, mes),
        numero: mes + 1,
        anio: anioCorte,
        quincena: null,
        fechaInicio: fechaInicioCorte,
        fechaVencimiento: fechaVence,
        monto: valorCuota,
      });
    }
  } else {
    for (let i = 0; i < 24; i++) {
      const totalMeses = mesInicio + i;
      const mes = totalMeses % 12;
      const anioCorte = anio + Math.floor(totalMeses / 12);
      const quincena = (i % 2) + 1;

      // Q1: días 1-15  ·  Q2: días 16 hasta fin de mes
      const inicioQ = new Date(anioCorte, mes, quincena === 1 ? 1 : 16);
      const ultimoDiaQ =
        quincena === 1 ? 15 : new Date(anioCorte, mes + 1, 0).getDate();

      // Vence el mismo día del mes en que arrancó el cliente,adjusted
      // al último día disponible de la quincena.
      const fechaVence = new Date(
        anioCorte,
        mes,
        Math.min(diaVencimiento, ultimoDiaQ),
      );

      cortes.push({
        codigo: codigoQuincenal(anioCorte, mes, quincena),
        numero: i + 1,
        anio: anioCorte,
        quincena,
        fechaInicio: inicioQ,
        fechaVencimiento: fechaVence,
        monto: valorCuota,
      });
    }
  }

  return cortes;
}

/** Suma días a una fecha. */
export function sumarDias(fecha: Date, dias: number): Date {
  const r = new Date(fecha);
  r.setDate(r.getDate() + dias);
  return r;
}

/** ¿Venció el periodo? (hoy es posterior a la fecha de vencimiento) */
export function estaVencido(fechaVencimiento: Date, referencia?: Date): boolean {
  return soloFecha(fechaVencimiento) < (referencia ? soloFecha(referencia) : hoy());
}

/** Rango de fechas del mes actual. */
export function rangoMesActual(): { desde: Date; hasta: Date } {
  const ahora = new Date();
  return {
    desde: new Date(ahora.getFullYear(), ahora.getMonth(), 1),
    hasta: new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59),
  };
}

/** Rango de fechas de un año. */
export function rangoAnio(anio: number): { desde: Date; hasta: Date } {
  return {
    desde: new Date(anio, 0, 1),
    hasta: new Date(anio, 11, 31, 23, 59, 59),
  };
}

/** Lista de meses de un año para las gráficas. */
export function mesesDelAnio(anio: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    anio,
    mes: i,
    etiqueta: etiquetaMes(anio, i),
  }));
}
