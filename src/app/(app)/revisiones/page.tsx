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

type Revision = {
  id: string;
  clienteId: string;
  cliente: { id: string; nombre: string; telefono: string | null };
  fecha: string;
  tipo: string;
  estado: string;
  motivo: string | null;
  diagnostico: string | null;
  solucion: string | null;
  duracionMin: number | null;
  senalDbm: number | null;
  velocidadBajada: string | null;
  velocidadSubida: string | null;
  valorCobrado: number;
  proximaRevision: string | null;
  observacion: string | null;
  tecnico: string | null;
};

const ESTADOS = ["TODOS", "PENDIENTE", "EN_PROCESO", "COMPLETADA", "CANCELADA"];
const TONOS: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
  COMPLETADA: "success",
  EN_PROCESO: "warning",
  PENDIENTE: "warning",
  CANCELADA: "danger",
};

export default function RevisionesPage() {
  const [items, setItems] = React.useState<Revision[]>([]);
  const [clientes, setClientes] = React.useState<{ id: string; nombre: string }[]>([]);
  const [q, setQ] = React.useState("");
  const [estado, setEstado] = React.useState("TODOS");
  const [cargando, setCargando] = React.useState(true);
  const [abierto, setAbierto] = React.useState(false);
  const [editando, setEditando] = React.useState<Revision | null>(null);
  const [guardando, setGuardando] = React.useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch(`/api/revisiones?estado=${estado}&q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
    } catch {
      toast.error("Error al cargar revisiones");
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
      tipo: formData.get("tipo"),
      estado: formData.get("estado"),
      motivo: formData.get("motivo") || null,
      diagnostico: formData.get("diagnostico") || null,
      solucion: formData.get("solucion") || null,
      duracionMin: formData.get("duracionMin") ? Number(formData.get("duracionMin")) : null,
      senalDbm: formData.get("senalDbm") ? Number(formData.get("senalDbm")) : null,
      velocidadBajada: formData.get("velocidadBajada") || null,
      velocidadSubida: formData.get("velocidadSubida") || null,
      valorCobrado: Number(formData.get("valorCobrado")) || 0,
      proximaRevision: formData.get("proximaRevision") || null,
      observacion: formData.get("observacion") || null,
      tecnico: formData.get("tecnico") || null,
    };

    try {
      const res = await fetch(id ? `/api/revisiones/${id}` : "/api/revisiones", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      toast.success(id ? "Revisión actualizada" : "Revisión registrada");
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
    if (!confirm("¿Eliminar esta revisión?")) return;
    const res = await fetch(`/api/revisiones/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Revisión eliminada");
      cargar();
    } else toast.error("No se pudo eliminar");
  }

  const pendientes = items.filter((i) => i.estado === "PENDIENTE" || i.estado === "EN_PROCESO").length;
  const vencidas = items.filter(
    (i) => i.proximaRevision && new Date(i.proximaRevision) < new Date() && i.estado === "COMPLETADA",
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Revisiones</h1>
          <p className="text-sm text-slate-500">
            {items.length} registros · {pendientes} pendientes · {vencidas} con mantenimiento vencido
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cliente, motivo..."
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
          <Vacio titulo="Sin revisiones" descripcion="Registra la primera revisión." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden lg:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Señal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden lg:table-cell">Cobrado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{i.cliente.nombre}</div>
                      <div className="text-xs text-slate-500">{i.tecnico}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">
                      {new Date(i.fecha).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-600">
                      {i.tipo}
                    </td>
                    <td className="px-4 py-3 max-w-[220px] text-sm text-slate-600">
                      <div className="truncate">{i.motivo ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">
                      {i.senalDbm !== null ? `${i.senalDbm} dBm` : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-slate-900">
                      {i.valorCobrado > 0 ? formatCOP(i.valorCobrado) : "—"}
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
        title={editando ? "Editar revisión" : "Nueva revisión"}
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
              <Select name="tipo" defaultValue={editando?.tipo ?? "RUTINA"}>
                <option value="RUTINA">Rutina</option>
                <option value="CORRECTIVA">Correctiva</option>
                <option value="INSTALACION">Instalación</option>
                <option value="REACTIVACION">Reactivación</option>
                <option value="OTRO">Otro</option>
              </Select>
            </Field>
            <Field label="Estado">
              <Select name="estado" defaultValue={editando?.estado ?? "PENDIENTE"}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
              </Select>
            </Field>
            <Field label="Motivo" className="md:col-span-2">
              <Input name="motivo" defaultValue={editando?.motivo ?? ""} placeholder="¿Por qué se hace la revisión?" />
            </Field>
            <Field label="Diagnóstico" className="md:col-span-2">
              <Textarea name="diagnostico" rows={2} defaultValue={editando?.diagnostico ?? ""} />
            </Field>
            <Field label="Solución aplicada" className="md:col-span-2">
              <Textarea name="solucion" rows={2} defaultValue={editando?.solucion ?? ""} />
            </Field>
            <Field label="Duración (minutos)">
              <Input type="number" name="duracionMin" defaultValue={editando?.duracionMin ?? ""} />
            </Field>
            <Field label="Señal (dBm)" hint="Ej: -58">
              <Input type="number" name="senalDbm" step="0.1" defaultValue={editando?.senalDbm ?? ""} />
            </Field>
            <Field label="Velocidad bajada medida">
              <Input name="velocidadBajada" defaultValue={editando?.velocidadBajada ?? ""} placeholder="Ej: 28 Mbps" />
            </Field>
            <Field label="Velocidad subida medida">
              <Input name="velocidadSubida" defaultValue={editando?.velocidadSubida ?? ""} placeholder="Ej: 14 Mbps" />
            </Field>
            <Field label="Valor cobrado (COP)">
              <Input type="number" name="valorCobrado" step="1000"
                defaultValue={String(editando?.valorCobrado ?? 0)} />
            </Field>
            <Field label="Próxima revisión">
              <Input type="date" name="proximaRevision"
                defaultValue={editando?.proximaRevision?.split("T")[0] ?? ""} />
            </Field>
            <Field label="Técnico">
              <Input name="tecnico" defaultValue={editando?.tecnico ?? ""} />
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
