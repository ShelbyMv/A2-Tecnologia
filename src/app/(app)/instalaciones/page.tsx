"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Vacio } from "@/components/ui/kpi";
import { formatCOP } from "@/lib/formato";

type Instalacion = {
  id: string;
  clienteId: string;
  cliente: { id: string; nombre: string; telefono: string | null };
  fecha: string;
  fechaProgramada: string | null;
  fechaCompletada: string | null;
  tipo: string;
  estado: string;
  zona: string | null;
  direccion: string | null;
  telefono: string | null;
  valorInstalacion: number;
  manoObra: number;
  routerDesc: string | null;
  mac: string | null;
  ip: string | null;
  longitudCable: number | null;
  observacion: string | null;
  recibidoPor: string | null;
};

const ESTADOS = ["TODOS", "PENDIENTE", "PROGRAMADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"];
const TONOS: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
  COMPLETADA: "success",
  PROGRAMADA: "info",
  PENDIENTE: "warning",
  EN_PROCESO: "warning",
  CANCELADA: "danger",
};

export default function InstalacionesPage() {
  const [items, setItems] = React.useState<Instalacion[]>([]);
  const [clientes, setClientes] = React.useState<{ id: string; nombre: string }[]>([]);
  const [q, setQ] = React.useState("");
  const [estado, setEstado] = React.useState("TODOS");
  const [cargando, setCargando] = React.useState(true);
  const [abierto, setAbierto] = React.useState(false);
  const [editando, setEditando] = React.useState<Instalacion | null>(null);
  const [guardando, setGuardando] = React.useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch(`/api/instalaciones?estado=${estado}&q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
    } catch {
      toast.error("Error al cargar instalaciones");
    } finally {
      setCargando(false);
    }
  }

  React.useEffect(() => {
    fetch("/api/clientes?pageSize=50")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setClientes(d.items.map((c: any) => ({ id: c.id, nombre: c.nombre }))))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, q]);

  async function guardar(formData: FormData) {
    setGuardando(true);
    const id = formData.get("id") as string;
    const payload = {
      clienteId: formData.get("clienteId"),
      fecha: formData.get("fecha"),
      fechaProgramada: formData.get("fechaProgramada") || null,
      fechaCompletada: formData.get("fechaCompletada") || null,
      tipo: formData.get("tipo"),
      estado: formData.get("estado"),
      zona: formData.get("zona") || null,
      direccion: formData.get("direccion") || null,
      telefono: formData.get("telefono") || null,
      valorInstalacion: Number(formData.get("valorInstalacion")) || 0,
      manoObra: Number(formData.get("manoObra")) || 0,
      routerDesc: formData.get("routerDesc") || null,
      mac: formData.get("mac") || null,
      ip: formData.get("ip") || null,
      longitudCable: formData.get("longitudCable") ? Number(formData.get("longitudCable")) : null,
      observacion: formData.get("observacion") || null,
      recibidoPor: formData.get("recibidoPor") || null,
    };

    try {
      const res = await fetch(id ? `/api/instalaciones/${id}` : "/api/instalaciones", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      toast.success(id ? "Instalación actualizada" : "Instalación registrada");
      setAbierto(false);
      setEditando(null);
      await cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta instalación?")) return;
    const res = await fetch(`/api/instalaciones/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Instalación eliminada");
      cargar();
    } else toast.error("No se pudo eliminar");
  }

  const totalCobrado = items.reduce((s, i) => s + i.valorInstalacion + i.manoObra, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Instalaciones</h1>
          <p className="text-sm text-slate-500">
            {items.length} registros · Total cobrado {formatCOP(totalCobrado)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cliente, dirección..."
              className="w-56 pl-10"
            />
          </div>
          <Select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-40">
            {ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
          </Select>
          <Button onClick={() => { setEditando(null); setAbierto(true); }}>
            <Plus className="h-4 w-4" /> Nueva
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <div className="flex justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
          </div>
        ) : items.length === 0 ? (
          <Vacio titulo="Sin instalaciones" descripcion="Registra la primera instalación." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden lg:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Dirección</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Valor</th>
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
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-600">
                      {i.tipo.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">
                      {i.direccion ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {formatCOP(i.valorInstalacion + i.manoObra)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={TONOS[i.estado] ?? "neutral"}>
                        {i.estado.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                          onClick={() => { setEditando(i); setAbierto(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => eliminar(i.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
        title={editando ? "Editar instalación" : "Nueva instalación"}
        size="lg"
      >
        <form onSubmit={async (e) => { e.preventDefault(); await guardar(new FormData(e.currentTarget)); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cliente" required>
              <Select name="clienteId" defaultValue={editando?.clienteId ?? ""} required>
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Fecha" required>
              <Input type="date" name="fecha"
                defaultValue={editando?.fecha?.split("T")[0] ?? new Date().toISOString().split("T")[0]}
                required />
            </Field>
            <Field label="Tipo">
              <Select name="tipo" defaultValue={editando?.tipo ?? "NUEVA"}>
                <option value="NUEVA">Nueva</option>
                <option value="REINSTALACION">Reinstalación</option>
                <option value="TRASLADO">Traslado</option>
                <option value="CAMBIO_PLAN">Cambio de plan</option>
              </Select>
            </Field>
            <Field label="Estado">
              <Select name="estado" defaultValue={editando?.estado ?? "PENDIENTE"}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
              </Select>
            </Field>
            <Field label="Dirección">
              <Input name="direccion" defaultValue={editando?.direccion ?? ""} />
            </Field>
            <Field label="Zona">
              <Input name="zona" defaultValue={editando?.zona ?? ""} />
            </Field>
            <Field label="Teléfono">
              <Input name="telefono" defaultValue={editando?.telefono ?? ""} />
            </Field>
            <Field label="Recibido por">
              <Input name="recibidoPor" defaultValue={editando?.recibidoPor ?? ""} />
            </Field>
            <Field label="Valor instalación (COP)">
              <Input type="number" name="valorInstalacion" step="1000"
                defaultValue={String(editando?.valorInstalacion ?? 50000)} />
            </Field>
            <Field label="Mano de obra (COP)">
              <Input type="number" name="manoObra" step="1000"
                defaultValue={String(editando?.manoObra ?? 25000)} />
            </Field>
            <Field label="Router / equipo">
              <Input name="routerDesc" defaultValue={editando?.routerDesc ?? ""} />
            </Field>
            <Field label="MAC">
              <Input name="mac" defaultValue={editando?.mac ?? ""} />
            </Field>
            <Field label="IP">
              <Input name="ip" defaultValue={editando?.ip ?? ""} />
            </Field>
            <Field label="Longitud de cable (m)">
              <Input type="number" name="longitudCable" step="0.1"
                defaultValue={editando?.longitudCable ?? ""} />
            </Field>
            <Field label="Observaciones" className="md:col-span-2">
              <Textarea name="observacion" rows={2} defaultValue={editando?.observacion ?? ""} />
            </Field>
          </div>
          <input type="hidden" name="id" defaultValue={editando?.id ?? ""} />
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : editando ? "Actualizar" : "Registrar"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
