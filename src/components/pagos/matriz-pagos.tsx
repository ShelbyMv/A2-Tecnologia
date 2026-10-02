"use client";

import * as React from "react";
import {
  ChevronLeft, ChevronRight, Loader2, Printer, Ban, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/formato";

type EstadoPeriodo =
  | "PENDIENTE" | "PAGADO" | "PARCIAL" | "ATRASADO" | "FUTURO" | "ANULADO" | "EXONERADO";

type Columna = { key: string; label: string; mes: number; quincena: number | null };

type Celda = {
  codigo: string;
  estado: EstadoPeriodo;
  monto: number;
  pagado: number;
  saldo: number;
  periodoId?: string;
};

type Fila = {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  zona: string | null;
  plan: string;
  frecuencia: "MENSUAL" | "QUINCENAL";
  valorCuota: number;
  estado: string;
  celdas: Celda[];
  totalPendiente: number;
  totalPagado: number;
};

type Matriz = {
  anio: number;
  vista: string;
  columnas: Columna[];
  filas: Fila[];
  resumen: { totalPendiente: number; totalPagado: number; totalClientes: number };
};

type ClienteSimple = { id: string; nombre: string; valorCuota: number; frecuencia: string };

const CLASE_CELDA: Record<EstadoPeriodo, string> = {
  PAGADO: "matriz-pagado",
  PARCIAL: "matriz-parcial",
  PENDIENTE: "matriz-pendiente",
  ATRASADO: "matriz-atrasado",
  FUTURO: "matriz-futuro",
  EXONERADO: "matriz-exonerado",
  ANULADO: "matriz-anulado",
};

export function MatrizPagos() {
  const [anio, setAnio] = React.useState(new Date().getFullYear());
  const [vista, setVista] = React.useState<"MENSUAL" | "QUINCENAL">("MENSUAL");
  const [matriz, setMatriz] = React.useState<Matriz | null>(null);
  const [cargando, setCargando] = React.useState(true);

  // Dialog de registro de pago
  const [celdaSeleccionada, setCeldaSeleccionada] = React.useState<{
    fila: Fila; celda: Celda;
  } | null>(null);
  const [guardando, setGuardando] = React.useState(false);

  const anios = React.useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i),
    [],
  );

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch(`/api/matriz-pagos?anio=${anio}&vista=${vista}`);
      if (!res.ok) throw new Error();
      setMatriz(await res.json());
    } catch {
      toast.error("Error al cargar la matriz de pagos");
    } finally {
      setCargando(false);
    }
  }

  React.useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, vista]);

  async function registrarPago(formData: FormData) {
    if (!celdaSeleccionada) return;
    setGuardando(true);

    const { fila, celda } = celdaSeleccionada;
    const monto = Number(formData.get("monto")) || 0;

    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: fila.id,
          fecha: formData.get("fecha"),
          monto,
          metodo: formData.get("metodo"),
          referencia: formData.get("referencia") || null,
          concepto: `Pago ${celda.codigo} - ${fila.nombre}`,
          nota: formData.get("nota") || null,
          // Si el pago cubre todo, se aplica al periodo; si es abono parcial también.
          aplicaciones: celda.periodoId
            ? [{ periodoId: celda.periodoId, monto }]
            : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al registrar el pago");
        setGuardando(false);
        return;
      }

      toast.success(
        `Pago registrado · Recibo #${data.numeroRecibo} · ${formatCOP(monto)}`,
      );
      setCeldaSeleccionada(null);
      await cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  const resumen = matriz?.resumen;

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnio((a) => a - 1)}
            aria-label="Año anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={String(anio)}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-28"
          >
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnio((a) => a + 1)}
            aria-label="Año siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="ml-2 flex rounded-lg border border-slate-300 bg-white p-0.5">
            <button
              onClick={() => setVista("MENSUAL")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                vista === "MENSUAL" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              Mensual
            </button>
            <button
              onClick={() => setVista("QUINCENAL")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                vista === "QUINCENAL" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              Quincenal
            </button>
          </div>
        </div>

        {/* Leyenda de colores */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border matriz-pagado" /> Pagado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border matriz-parcial" /> Abono
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border matriz-pendiente" /> Pendiente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border matriz-atrasado" /> Atrasado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border matriz-futuro" /> Futuro
          </span>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cobrado {anio}</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">{formatCOP(resumen.totalPagado)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Por cobrar</p>
            <p className="mt-1 text-xl font-bold text-red-600">{formatCOP(resumen.totalPendiente)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clientes en la matriz</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{resumen.totalClientes}</p>
          </div>
        </div>
      )}

      {/* Matriz */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando matriz...
          </div>
        ) : !matriz || matriz.filas.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            No hay clientes activos. Registra clientes primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-semibold text-slate-700 min-w-[190px]">
                    Cliente
                  </th>
                  {matriz.columnas.map((col) => (
                    <th
                      key={col.key}
                      className="border-b border-l border-slate-200 px-1 py-2.5 text-center font-semibold text-slate-600 min-w-[52px]"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="border-b border-l border-slate-200 px-3 py-2.5 text-right font-semibold text-slate-700">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody>
                {matriz.filas.map((fila) => (
                  <tr key={fila.id} className="group hover:bg-slate-50/50">
                    <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-2 group-hover:bg-slate-50">
                      <div className="font-medium text-slate-900 truncate max-w-[180px]">
                        {fila.nombre}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {fila.plan} · {formatCOP(fila.valorCuota)}
                      </div>
                    </td>
                    {fila.celdas.map((celda, idx) => {
                      const col = matriz.columnas[idx];
                      const clickable = celda.periodoId && celda.estado !== "PAGADO";
                      return (
                        <td key={col.key} className="border-b border-l border-slate-100 p-0.5">
                          <button
                            onClick={() =>
                              celda.periodoId && setCeldaSeleccionada({ fila, celda })
                            }
                            disabled={!clickable}
                            title={
                              `${fila.nombre} · ${celda.codigo}\n` +
                              `Estado: ${celda.estado}\n` +
                              `Monto: ${formatCOP(celda.monto)}\n` +
                              (celda.pagado > 0 ? `Pagado: ${formatCOP(celda.pagado)}\n` : "") +
                              (celda.saldo > 0 ? `Saldo: ${formatCOP(celda.saldo)}` : "")
                            }
                            className={cn(
                              "h-8 w-full rounded border text-[10px] font-semibold transition-transform",
                              CLASE_CELDA[celda.estado],
                              clickable && "cursor-pointer hover:scale-105 hover:shadow",
                              !clickable && "cursor-default",
                            )}
                          >
                            {celda.estado === "PAGADO"
                              ? "✓"
                              : celda.estado === "PARCIAL"
                                ? "±"
                                : celda.estado === "ATRASADO"
                                  ? "✗"
                                  : ""}
                          </button>
                        </td>
                      );
                    })}
                    <td
                      className={cn(
                        "border-b border-l border-slate-100 px-3 py-2 text-right font-semibold",
                        fila.totalPendiente > 0 ? "text-red-600" : "text-emerald-600",
                      )}
                    >
                      {formatCOP(fila.totalPendiente)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog de registro de pago */}
      <Dialog
        open={Boolean(celdaSeleccionada)}
        onClose={() => setCeldaSeleccionada(null)}
        title="Registrar pago"
        description={
          celdaSeleccionada
            ? `${celdaSeleccionada.fila.nombre} · Corte ${celdaSeleccionada.celda.codigo} · Saldo ${formatCOP(celdaSeleccionada.celda.saldo)}`
            : ""
        }
        size="sm"
      >
        {celdaSeleccionada && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await registrarPago(new FormData(e.currentTarget));
            }}
          >
            <div className="space-y-4">
              <Field label="Valor pagado (COP)" required>
                <Input
                  type="number"
                  name="monto"
                  defaultValue={String(celdaSeleccionada.celda.saldo || celdaSeleccionada.celda.monto)}
                  step="1000"
                  min="1"
                  required
                  autoFocus
                />
              </Field>

              <Field label="Fecha del pago" required>
                <Input
                  type="date"
                  name="fecha"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </Field>

              <Field label="Método de pago">
                <Select name="metodo" defaultValue="EFECTIVO">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                  <option value="WOMPI">Wompi</option>
                  <option value="OTRO">Otro</option>
                </Select>
              </Field>

              <Field label="Referencia">
                <Input name="referencia" placeholder="Nº de comprobante, transaction..." />
              </Field>

              <Field label="Nota">
                <Textarea name="nota" rows={2} placeholder="Observaciones (opcional)" />
              </Field>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={() => setCeldaSeleccionada(null)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="success" disabled={guardando}>
                  {guardando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Registrar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
