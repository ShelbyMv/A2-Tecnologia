"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/formato";

type Plan = {
  id: string;
  nombre: string;
  velocidadBajada: string | null;
  velocidadSubida: string | null;
  valorMensual: number;
  descripcion: string | null;
  activo: boolean;
};

export default function PlanesPage() {
  const [planes, setPlanes] = React.useState<Plan[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [abierto, setAbierto] = React.useState(false);
  const [editando, setEditando] = React.useState<Plan | null>(null);
  const [guardando, setGuardando] = React.useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch("/api/planes");
      if (!res.ok) throw new Error();
      setPlanes(await res.json());
    } catch {
      toast.error("Error al cargar planes");
    } finally {
      setCargando(false);
    }
  }

  React.useEffect(() => { cargar(); }, []);

  async function guardar(formData: FormData) {
    setGuardando(true);
    const id = formData.get("id") as string;
    const payload = {
      nombre: formData.get("nombre"),
      velocidadBajada: formData.get("velocidadBajada") || null,
      velocidadSubida: formData.get("velocidadSubida") || null,
      valorMensual: Number(formData.get("valorMensual")) || 0,
      descripcion: formData.get("descripcion") || null,
      activo: formData.get("activo") === "true",
    };

    try {
      const res = await fetch(id ? `/api/planes/${id}` : "/api/planes", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Error al guardar");
        return;
      }
      toast.success(id ? "Plan actualizado" : "Plan creado");
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
    if (!confirm("¿Eliminar este plan? No se puede si hay clientes asignados.")) return;
    const res = await fetch(`/api/planes/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (res.ok) {
      toast.success("Plan eliminado");
      cargar();
    } else {
      toast.error(result.error ?? "No se pudo eliminar");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Planes</h1>
          <p className="text-sm text-slate-500">{planes.length} planes configurados</p>
        </div>
        <Button onClick={() => { setEditando(null); setAbierto(true); }}>
          <Plus className="h-4 w-4" /> Nuevo plan
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <div className="flex justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
          </div>
        ) : planes.length === 0 ? (
          <p className="px-4 py-12 text-center text-slate-500">
            No hay planes. Crea el primero con "Nuevo plan".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Velocidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Valor mensual</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {planes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{p.nombre}</div>
                      {p.descripcion && <div className="text-xs text-slate-500">{p.descripcion}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {p.velocidadBajada ?? "—"} / {p.velocidadSubida ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {formatCOP(p.valorMensual)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        p.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
                      )}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                          onClick={() => { setEditando(p); setAbierto(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => eliminar(p.id)}>
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
        title={editando ? "Editar plan" : "Nuevo plan"}
        size="sm"
      >
        <form onSubmit={async (e) => { e.preventDefault(); await guardar(new FormData(e.currentTarget)); }}>
          <div className="space-y-4">
            <Field label="Nombre" required>
              <Input name="nombre" defaultValue={editando?.nombre ?? ""} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Velocidad bajada">
                <Input name="velocidadBajada" defaultValue={editando?.velocidadBajada ?? ""} placeholder="Ej: 30 Mbps" />
              </Field>
              <Field label="Velocidad subida">
                <Input name="velocidadSubida" defaultValue={editando?.velocidadSubida ?? ""} placeholder="Ej: 15 Mbps" />
              </Field>
              <Field label="Valor mensual (COP)" required>
                <Input type="number" name="valorMensual" step="1000"
                  defaultValue={String(editando?.valorMensual ?? 0)} required />
              </Field>
              <Field label="¿Activo?">
                <select
                  name="activo"
                  defaultValue={String(editando?.activo ?? true)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </Field>
            </div>
            <Field label="Descripción">
              <Textarea name="descripcion" rows={2} defaultValue={editando?.descripcion ?? ""} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
