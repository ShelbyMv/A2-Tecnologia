// ============================================================================
//  Formato de moneda y números para Colombia (COP)
// ============================================================================

const formatterCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatterNumero = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** $40.000 */
export function formatCOP(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "$0";
  return formatterCOP.format(valor);
}

/** $40.000 (para celdas donde no se quiere el símbolo repetido) */
export function formatMoneda(valor: number): string {
  return formatterCOP.format(valor);
}

/** 1.234,5 */
export function formatNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "0";
  return formatterNumero.format(valor);
}

/** Convierte texto del usuario ("40000", "$40.000", "40 000") a número. */
export function parseNumero(texto: string | number): number {
  if (typeof texto === "number") return texto;
  if (!texto) return 0;
  const limpio = texto
    .replace(/[$\s.,]/g, (m) => (m === "." || m === "," ? "" : m))
    .replace(/[^\d-]/g, "");
  const n = Number.parseInt(limpio, 10);
  return Number.isNaN(n) ? 0 : n;
}
