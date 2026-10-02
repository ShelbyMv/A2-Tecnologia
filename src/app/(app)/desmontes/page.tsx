"use client";

import * as React from "react";
import { Plus, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Vacio } from "@/components/ui/kpi";
import { formatCOP } from "@/lib/formato";

type Equipo = {
  id: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  mac: string | null;
  estado: string;
  valor: number;
};

type Desmonte = {
  id: string;
  cliente: { id: string; nombre: string; telefono: string | null };
  fecha: string;
  motivo: string;
  estado: string;
  direccion: string | null;
  zona: string | null;
  saldoFavor: number;
  valorEquipos: number;
  observacion: string | null;
  tecnico: string | null;
  equipos: Equipo[];
};

const ESTADOS = ["TODOS", "PENDIENTE", "PROGRAMADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"];
const TONOS: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
  COMPLETADA: "success",
  PROGRAMADA: "info",
  EN_PROCESO: "warning",
  PENDIENTE: "warning",
  CANCELADA: "danger",
};

export default function DesmontesPage() {
  const [items, setItems] = React.useState<Desmonte[]>([]);
  const [clientes, setClientes] = React.useState<{ id: string; nombre: string }[]>([]);
  const [q, setQ] = React.useState("");
  const [estado, setEstado] = React.useState("TODOS");
  const [cargando, setCargando] = React.useState(true);
  const [abierto, setAbierto] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);

  // Equipos retirados del formulario (líneas dinámicas)
  const [equipos, setEquipos] = React.useState<
    { tipo: string; marca: string; modelo: string; estado: string; valor: string }[]
  >([]);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch(`/api/desmontes?estado=${estado}&q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
    } catch {
      toast.error("Error al cargar desmontes");
    } finally {
      setCargando(false);
    }
  }

  React.useEffect(() => {
    fetch("/api/clientes?pageSize=50&estado=TODOS")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setClientes(d.items.map((c: any) => ({ id: c.id, nombre: c.nombre }))))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, q]);

  function agregarEquipo() {
    setEquipos((e) => [...e, { tipo: "", marca: "", modelo: "", estado: "FUNCIONAL", valor: "0" }]);
  }

  function quitarEquipo(idx: number) {
    setEquipos((e) => e.filter((_, i) => i !== idx));
  }

  async function guardar(formData: FormData) {
    setGuardando(true);
    const payload = {
      clienteId: formData.get("clienteId"),
      fecha: formData.get("fecha"),
      motivo: formData.get("motivo"),
      estado: formData.get("estado"),
      direccion: formData.get("direccion") || null,
      zona: formData.get("zona") || null,
      saldoFavor: Number(formData.get("saldoFavor")) || 0,
      valorEquipos: equipos.reduce((s, e) => s + (Number(e.valor) || 0), 0),
      observacion: formData.get("observacion") || null,
      tecnico: formData.get("tecnico") || null,
      equipos: equipos
        .filter((e) => e.tipo.trim() !== "")
        .map((e) => ({
          tipo: e.tipo,
          marca: e.marca || null,
          modelo: e.modelo || null,
          estado: e.estado,
          valor: Number(e.valor) || 0,
        })),
    };

    try {
      const res = await fetch("/api/desmontes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      toast.success("Desmonte registrado");
      setAbierto(false);
      setEquipos([]);
      await cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este desmonte?")) return;
    const res = await fetch(`/api/desmontes/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Desmonte eliminado");
      cargar();
    } else toast.error("No se pudo eliminar");
  }

  const totalEquipos = items.reduce((s, i) => s + i.valorEquipos, 0);
  const totalSaldoFavor = items.reduce((s, i) => s + i.saldoFavor, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Desmontes</h1>
          <p className="text-sm text-slate-500">
            {items.length} registros · Equipos recuperados {formatCOP(totalEquipos)} · Saldo a favor {formatCOP(totalSaldoFavor)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-56 pl-10"
            />
          </div>
          <Select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-40">
            {ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
          </Select>
          <Button onClick={() => { setEquipos([]); setAbierto(true); }}>
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <div className="flex justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
          </div>
        ) : items.length === 0 ? (
          <Vacio titulo="Sin desmontes" descripcion="Registra el primer desmonte." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Equipos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden lg:table-cell">Saldo a favor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{i.cliente.nombre}</div>
                      <div className="text-xs text-slate-500">{i.cliente.telefono}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">
                      {new Date(i.fecha).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{i.motivo.replace("_", " ")}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">
                      {i.equipos.length > 0 ? `${i.equipos.length} equipo(s)` : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-slate-900">
                      {i.saldoFavor > 0 ? formatCOP(i.saldoFavor) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={TONOS[i.estado] ?? "neutral"}>
                        {i.estado.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => eliminar(i.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={abierto}
        onClose={() => setAbierto(false)}
        title="Nuevo desmonte"
        description="Retiro de equipos del cliente. Al completarlo, el cliente pasa a estado DESMONTADO."
        size="lg"
      >
        <form onSubmit={async (e) => { e.preventDefault(); await guardar(new FormData(e.currentTarget)); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cliente" required>
              <Select name="clienteId" required>
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Fecha" required>
              <Input type="date" name="fecha"
                defaultValue={new Date().toISOString().split("T")[0]} required />
            </Field>
            <Field label="Motivo">
              <Select name="motivo" defaultValue="NO_PAGO">
                <option value="NO_PAGO">No pago</option>
                <option value="RENUNCIA">Renuncia del cliente</option>
                <option value="FALLA">Falla técnica</option>
                <option value="CAMBIO_PLAN">Cambio de plan</option>
                <option value="INACTIVO">Cliente inactivo</option>
                <option value="TRASLADO">Traslado</option>
                <option value="OTRO">Otro</option>
              </Select>
            </Field>
            <Field label="Estado">
              <Select name="estado" defaultValue="PENDIENTE">
                <option value="PENDIENTE">Pendiente</option>
                <option value="PROGRAMADA">Programado</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADA">Completado</option>
                <option value="CANCELADA">Cancelado</option>
              </Select>
            </Field>
            <Field label="Dirección">
              <Input name="direccion" />
            </Field>
            <Field label="Zona">
              <Input name="zona" />
            </Field>
            <Field label="Saldo a favor del cliente (COP)" hint="Dinero no cobrado que hay que devolver">
              <Input type="number" name="saldoFavor" step="1000" defaultValue="0" />
            </Field>
            <Field label="Técnico">
              <Input name="tecnico" />
            </Field>
          </div>

          {/* Equipos retirados */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Equipos retirados</p>
              <Button type="button" variant="outline" size="sm" onClick={agregarEquipo}>
                <Plus className="h-3 w-3" /> Agregar equipo
              </Button>
            </div>
            {equipos.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">
                Sin equipos. Usa "Agregar equipo" para registrar el router, antena, etc.
              </p>
            ) : (
              <div className="space-y-2">
                {equipos.map((eq, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 p-2.5">
                    <input
                      className="col-span-4 h-9 rounded-md border border-slate-300 px-2 text-sm"
                      placeholder="Tipo (Router, Antena...)"
                      value={eq.tipo}
                      onChange={(e) =>
                        setEquipos((arr) => arr.map((x, i) => i === idx ? { ...x, tipo: e.target.value } : x))
                      }
                    />
                    <input
                      className="col-span-2 h-9 rounded-md border border-slate-300 px-2 text-sm"
                      placeholder="Marca"
                      value={eq.marca}
                      onChange={(e) =>
                        setEquipos((arr) => arr.map((x, i) => i === idx ? { ...x, marca: e.target.value } : x))
                      }
                    />
                    <select
                      className="col-span-3 h-9 rounded-md border border-slate-300 px-2 text-sm"
                      value={eq.estado}
                      onChange={(e) =>
                        setEquipos((arr) => arr.map((x, i) => i === idx ? { ...x, estado: e.target.value } : x))
                      }
                    >
                      <option value="FUNCIONAL">Funcional</option>
                      <option value="DANADO">Dañado</option>
                      <option value="NO_APORTA">No aporta</option>
                      <option value="PERDIDO">Perdido</option>
                    </select>
                    <input
                      className="col-span-2 h-9 rounded-md border border-slate-300 px-2 text-sm"
                      placeholder="Valor"
                      type="number"
                      value={eq.valor}
                      onChange={(e) =>
                        setEquipos((arr) => arr.map((x, i) => i === idx ? { ...x, valor: e.target.value } : x))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => quitarEquipo(idx)}
                      className="col-span-1 flex h-9 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                      aria-label="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Field label="Observaciones" className="mt-4">
            <Textarea name="observacion" rows={2} />
          </Field>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Registrar desmonte"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
