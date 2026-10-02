"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/formato";

type Estado = "ACTIVO" | "SUSPENDIDO" | "INACTIVO" | "DESMONTADO" | "TODOS";

type Cliente = {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  direccion: string | null;
  zona: string | null;
  barrio: string | null;
  email: string | null;
  planId: string | null;
  plan?: { nombre: string } | null;
  frecuencia: "MENSUAL" | "QUINCENAL";
  valorCuota: number;
  ip: string | null;
  mac: string | null;
  equipoDesc: string | null;
  fechaInstalacion: string | null;
  fechaActivacion: string | null;
  fechaInicioPago: string | null;
  estado: string;
  notas: string | null;
};

type Plan = { id: string; nombre: string; valorMensual: number; activo: boolean };

const ESTADOS: Estado[] = ["TODOS", "ACTIVO", "SUSPENDIDO", "INACTIVO", "DESMONTADO"];

const COLORES_ESTADO: Record<string, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700",
  SUSPENDIDO: "bg-amber-100 text-amber-700",
  INACTIVO: "bg-slate-100 text-slate-700",
  DESMONTADO: "bg-red-100 text-red-700",
};

export default function ClientesPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<Cliente[]>([]);
  const [planes, setPlanes] = React.useState<Plan[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [estado, setEstado] = React.useState<Estado>("TODOS");
  const [cargando, setCargando] = React.useState(true);
  const [abierto, setAbierto] = React.useState(false);
  const [editando, setEditando] = React.useState<Cliente | null>(null);
  const [guardando, setGuardando] = React.useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch(
        `/api/clientes?q=${encodeURIComponent(q)}&estado=${estado}&page=${page}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Error al cargar clientes");
    } finally {
      setCargando(false);
    }
  }

  React.useEffect(() => {
    fetch("/api/planes")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPlanes)
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, estado, page]);

  async function guardar(formData: FormData) {
    setGuardando(true);
    const id = formData.get("id") as string;
    const payload = {
      nombre: formData.get("nombre"),
      documento: formData.get("documento") || null,
      telefono: formData.get("telefono") || null,
      direccion: formData.get("direccion") || null,
      zona: formData.get("zona") || null,
      barrio: formData.get("barrio") || null,
      email: formData.get("email") || null,
      planId: formData.get("planId") || null,
      frecuencia: formData.get("frecuencia"),
      valorCuota: Number(formData.get("valorCuota")) || 0,
      ip: formData.get("ip") || null,
      mac: formData.get("mac") || null,
      equipoDesc: formData.get("equipoDesc") || null,
      fechaInstalacion: formData.get("fechaInstalacion") || null,
      fechaActivacion: formData.get("fechaActivacion") || null,
      fechaInicioPago: formData.get("fechaInicioPago") || null,
      estado: formData.get("estado"),
      notas: formData.get("notas") || null,
    };

    try {
      const res = await fetch(id ? `/api/clientes/${id}` : "/api/clientes", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Error al guardar");
        return;
      }
      toast.success(
        id
          ? "Cliente actualizado"
          : `Cliente creado${result.periodosCreados ? ` · ${result.periodosCreados} cortes generados` : ""}`,
      );
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
    if (!confirm("¿Eliminar este cliente? Se borrarán todos sus pagos e historial.")) return;
    const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (res.ok) {
      toast.success("Cliente eliminado");
      cargar();
    } else {
      toast.error(result.error ?? "No se pudo eliminar");
    }
  }

  function cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > totalPages) return;
    setPage(nueva);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">{total} clientes registrados</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, documento, teléfono..."
              className="w-60 pl-10"
            />
          </div>
          <Select
            value={estado}
            onChange={(e) => { setEstado(e.target.value as Estado); setPage(1); }}
            className="w-40"
          >
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Button onClick={() => { setEditando(null); setAbierto(true); }}>
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
          <p className="px-4 py-12 text-center text-slate-500">
            No hay clientes. Haz clic en "Nuevo" para agregar el primero.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Plan / Frec.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden lg:table-cell">Cuota</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Zona</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{c.nombre}</div>
                      <div className="text-xs text-slate-500">
                        {c.documento && `Doc: ${c.documento} · `}
                        {c.telefono}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">
                      {c.plan?.nombre ?? "Sin plan"}
                      <span className="ml-1.5 text-xs text-slate-400">({c.frecuencia})</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-slate-900">
                      {formatCOP(c.valorCuota)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">
                      {c.zona ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        COLORES_ESTADO[c.estado] ?? "bg-slate-100 text-slate-700",
                      )}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                          onClick={() => { setEditando(c); setAbierto(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => eliminar(c.id)}>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              Página {page} de {totalPages} · {total} total
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => cambiarPagina(page - 1)} disabled={page === 1}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => cambiarPagina(page + 1)} disabled={page === totalPages}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={abierto}
        onClose={() => setAbierto(false)}
        title={editando ? "Editar cliente" : "Nuevo cliente"}
        description={!editando ? "Si defines la fecha de inicio de pago, se generan los cortes del año automáticamente." : undefined}
        size="lg"
      >
        <form onSubmit={async (e) => { e.preventDefault(); await guardar(new FormData(e.currentTarget)); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" required>
              <Input name="nombre" defaultValue={editando?.nombre ?? ""} required />
            </Field>
            <Field label="Documento">
              <Input name="documento" defaultValue={editando?.documento ?? ""} />
            </Field>
            <Field label="Teléfono">
              <Input name="telefono" defaultValue={editando?.telefono ?? ""} />
            </Field>
            <Field label="Email">
              <Input type="email" name="email" defaultValue={editando?.email ?? ""} />
            </Field>
            <Field label="Dirección">
              <Input name="direccion" defaultValue={editando?.direccion ?? ""} />
            </Field>
            <Field label="Zona">
              <Input name="zona" defaultValue={editando?.zona ?? ""} />
            </Field>
            <Field label="Barrio">
              <Input name="barrio" defaultValue={editando?.barrio ?? ""} />
            </Field>
            <Field label="Plan">
              <Select name="planId" defaultValue={editando?.planId ?? ""}>
                <option value="">Sin plan</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} — {formatCOP(p.valorMensual)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Frecuencia de pago">
              <Select name="frecuencia" defaultValue={editando?.frecuencia ?? "MENSUAL"}>
                <option value="MENSUAL">Mensual</option>
                <option value="QUINCENAL">Quincenal</option>
              </Select>
            </Field>
            <Field label="Valor de la cuota (COP)">
              <Input type="number" name="valorCuota" step="1000"
                defaultValue={String(editando?.valorCuota ?? 0)} />
            </Field>
            <Field label="IP asignada">
              <Input name="ip" defaultValue={editando?.ip ?? ""} />
            </Field>
            <Field label="MAC">
              <Input name="mac" defaultValue={editando?.mac ?? ""} />
            </Field>
            <Field label="Equipo (router/ONT)">
              <Input name="equipoDesc" defaultValue={editando?.equipoDesc ?? ""} />
            </Field>
            <Field label="Estado">
              <Select name="estado" defaultValue={editando?.estado ?? "ACTIVO"}>
                <option value="ACTIVO">Activo</option>
                <option value="SUSPENDIDO">Suspendido</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="DESMONTADO">Desmontado</option>
              </Select>
            </Field>
            <Field label="Fecha de instalación">
              <Input type="date" name="fechaInstalacion"
                defaultValue={editando?.fechaInstalacion?.split("T")[0] ?? ""} />
            </Field>
            <Field label="Fecha de activación">
              <Input type="date" name="fechaActivacion"
                defaultValue={editando?.fechaActivacion?.split("T")[0] ?? ""} />
            </Field>
            <Field label="Fecha de inicio de pago" hint="Día del mes en que vence la cuota">
              <Input type="date" name="fechaInicioPago"
                defaultValue={editando?.fechaInicioPago?.split("T")[0] ?? ""} />
            </Field>
            <Field label="Notas" className="md:col-span-2">
              <Textarea name="notas" rows={2} defaultValue={editando?.notas ?? ""} />
            </Field>
          </div>
          <input type="hidden" name="id" defaultValue={editando?.id ?? ""} />
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
