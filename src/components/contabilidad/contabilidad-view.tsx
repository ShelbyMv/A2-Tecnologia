"use client";

import * as React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Building2, Plus, Trash2, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/formato";

type Mes = {
  mes: number; etiqueta: string;
  ingresos: number; egresos: number; ganancia: number; empresa: number; dueno: number;
};

type CatMonto = { nombre: string; monto: number; color: string };

type Transaccion = {
  id: string;
  fecha: string;
  tipo: string;
  categoria: { nombre: string; color: string };
  concepto: string;
  monto: number;
  montoEmpresa: number;
  montoDueno: number;
  metodo: string | null;
  automatica: boolean;
  cliente?: { nombre: string } | null;
};

type Contabilidad = {
  anio: number;
  totales: {
    ingresos: number; egresos: number; gananciaNeta: number;
    montoEmpresaIngresos: number; montoDuenoIngresos: number;
  };
  meses: Mes[];
  egresosPorCategoria: CatMonto[];
  ingresosPorCategoria: CatMonto[];
  cartera: { total: number; d0a30: number; d31a60: number; d61a90: number; mas90: number; porVencer: number };
  transacciones: Transaccion[];
};

type Categoria = { id: string; nombre: string; tipo: string; color: string };

export function ContabilidadView() {
  const [anio, setAnio] = React.useState(new Date().getFullYear());
  const [data, setData] = React.useState<Contabilidad | null>(null);
  const [categorias, setCategorias] = React.useState<Categoria[]>([]);
  const [cargando, setCargando] = React.useState(true);

  const [abierto, setAbierto] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);

  const anios = React.useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i),
    [],
  );

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch(`/api/contabilidad?anio=${anio}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Error al cargar la contabilidad");
    } finally {
      setCargando(false);
    }
  }

  React.useEffect(() => {
    fetch("/api/categorias")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategorias)
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio]);

  async function guardar(formData: FormData) {
    setGuardando(true);
    try {
      const res = await fetch("/api/transacciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: formData.get("fecha"),
          tipo: formData.get("tipo"),
          categoriaId: formData.get("categoriaId"),
          concepto: formData.get("concepto"),
          monto: Number(formData.get("monto")),
          metodo: formData.get("metodo") || null,
          observacion: formData.get("observacion") || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Error al guardar");
        return;
      }
      toast.success("Movimiento registrado");
      setAbierto(false);
      await cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    const res = await fetch(`/api/transacciones/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (res.ok) {
      toast.success("Movimiento eliminado");
      cargar();
    } else {
      toast.error(result.error ?? "No se pudo eliminar");
    }
  }

  const t = data?.totales;
  const monedaCorta = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
        ? `$${Math.round(v / 1_000)}k`
        : `$${v}`;

  return (
    <div className="space-y-5">
      {/* Controles + KPIs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setAnio((a) => a - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(anio)} onChange={(e) => setAnio(Number(e.target.value))} className="w-28">
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Button variant="outline" size="icon" onClick={() => setAnio((a) => a + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setAbierto(true)}>
          <Plus className="h-4 w-4" /> Nuevo movimiento
        </Button>
      </div>

      {cargando || !data ? (
        <div className="flex justify-center gap-2 py-24 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Ingresos {anio}</p>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-1.5 text-2xl font-bold text-emerald-600">{formatCOP(t!.ingresos)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Egresos {anio}</p>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <p className="mt-1.5 text-2xl font-bold text-red-600">{formatCOP(t!.egresos)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Ganancia neta</p>
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <p className={`mt-1.5 text-2xl font-bold ${t!.gananciaNeta >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {formatCOP(t!.gananciaNeta)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reparto de ingresos</p>
                <Building2 className="h-4 w-4 text-violet-600" />
              </div>
              <p className="mt-1.5 text-sm font-semibold text-violet-700">
                Empresa: {formatCOP(t!.montoEmpresaIngresos)}
              </p>
              <p className="text-sm font-semibold text-emerald-700">
                Dueño: {formatCOP(t!.montoDuenoIngresos)}
              </p>
            </div>
          </div>

          {/* Gráfica: ingresos vs egresos por mes */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Ingresos vs Egresos · {anio}
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.meses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tickFormatter={monedaCorta} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={((value: any, name: any) => [formatCOP(Number(value)), String(name)]) as any}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Gráfica circular de egresos */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Egresos por categoría</h3>
              {data.egresosPorCategoria.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">Sin egresos registrados este año.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.egresosPorCategoria}
                        dataKey="monto"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                      >
                        {data.egresosPorCategoria.map((c, i) => (
                          <Cell key={i} fill={c.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatCOP(Number(value))}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Cartera por antigüedad */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Cartera por antigüedad
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Por vencer", valor: data.cartera.porVencer, color: "bg-blue-500" },
                  { label: "1-30 días", valor: data.cartera.d0a30, color: "bg-amber-500" },
                  { label: "31-60 días", valor: data.cartera.d31a60, color: "bg-orange-500" },
                  { label: "61-90 días", valor: data.cartera.d61a90, color: "bg-red-500" },
                  { label: "Más de 90 días", valor: data.cartera.mas90, color: "bg-red-700" },
                ].map((f) => {
                  const pct = data.cartera.total > 0 ? Math.round((f.valor / data.cartera.total) * 100) : 0;
                  return (
                    <div key={f.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-600">{f.label}</span>
                        <span className="font-medium text-slate-900">
                          {formatCOP(f.valor)} <span className="text-xs text-slate-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${f.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
                  Total cartera: {formatCOP(data.cartera.total)}
                </div>
              </div>
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Movimientos del año</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Fecha</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Concepto</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Categoría</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">Monto</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.transacciones.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                        Sin movimientos este año.
                      </td>
                    </tr>
                  ) : (
                    data.transacciones.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-sm text-slate-600 whitespace-nowrap">
                          {new Date(tx.fecha).toLocaleDateString("es-CO")}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className={tx.tipo === "INGRESO" ? "text-emerald-600" : "text-red-600"}>●</span>
                            {tx.concepto}
                            {tx.automatica && (
                              <Badge tone="neutral" className="ml-1">auto</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: `${tx.categoria.color}1a`, color: tx.categoria.color }}
                          >
                            {tx.categoria.nombre}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-right text-sm font-semibold ${tx.tipo === "INGRESO" ? "text-emerald-600" : "text-red-600"}`}>
                          {tx.tipo === "INGRESO" ? "+" : "−"}{formatCOP(tx.monto)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {!tx.automatica && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => eliminar(tx.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Dialog nuevo movimiento */}
      <Dialog
        open={abierto}
        onClose={() => setAbierto(false)}
        title="Nuevo movimiento"
        description="Registra un ingreso o egreso manual. Los ingresos de pagos se crean automáticamente."
        size="sm"
      >
        <form onSubmit={async (e) => { e.preventDefault(); await guardar(new FormData(e.currentTarget)); }}>
          <div className="space-y-4">
            <Field label="Tipo" required>
              <Select name="tipo" defaultValue="EGRESO">
                <option value="EGRESO">Egreso</option>
                <option value="INGRESO">Ingreso</option>
              </Select>
            </Field>
            <Field label="Categoría" required>
              <Select name="categoriaId" required>
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo === "INGRESO" ? "ingreso" : "gasto"})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Concepto" required>
              <Input name="concepto" placeholder="Ej: Compra de 10 conectores RJ45" required />
            </Field>
            <Field label="Monto (COP)" required>
              <Input type="number" name="monto" step="1000" min="1" required />
            </Field>
            <Field label="Fecha" required>
              <Input type="date" name="fecha"
                defaultValue={new Date().toISOString().split("T")[0]} required />
            </Field>
            <Field label="Método">
              <Select name="metodo" defaultValue="EFECTIVO">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Daviplata</option>
                <option value="OTRO">Otro</option>
              </Select>
            </Field>
            <Field label="Observaciones">
              <Textarea name="observacion" rows={2} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Registrar"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
