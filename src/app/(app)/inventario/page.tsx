"use client";

import * as React from "react";
import {
  Plus, Pencil, Trash2, Loader2, Search, AlertTriangle, History, Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Kpi, Vacio } from "@/components/ui/kpi";
import { formatCOP, formatNumero } from "@/lib/formato";

type Item = {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string | null;
  modelo: string | null;
  descripcion: string | null;
  ubicacion: string | null;
  stock: number;
  stockMinimo: number;
  unidad: string;
  costoUnitario: number;
  precioVenta: number;
  proveedor: string | null;
  categoriaId: string;
  categoria: { nombre: string };
};

type Movimiento = {
  id: string;
  tipo: string;
  origen: string;
  cantidad: number;
  delta: number;
  costoUnitario: number;
  total: number;
  stockResultante: number;
  fecha: string;
  motivo: string | null;
};

export default function InventarioPage() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [categorias, setCategorias] = React.useState<{ id: string; nombre: string }[]>([]);
  const [resumen, setResumen] = React.useState({ valorTotal: 0, bajoStock: 0, totalItems: 0 });
  const [q, setQ] = React.useState("");
  const [categoriaId, setCategoriaId] = React.useState("TODAS");
  const [soloBajoStock, setSoloBajoStock] = React.useState(false);
  const [cargando, setCargando] = React.useState(true);

  const [abierto, setAbierto] = React.useState(false);
  const [editando, setEditando] = React.useState<Item | null>(null);
  const [guardando, setGuardando] = React.useState(false);

  // Dialog de movimiento
  const [itemMovimiento, setItemMovimiento] = React.useState<Item | null>(null);
  const [movimientos, setMovimientos] = React.useState<Movimiento[]>([]);
  const [guardandoMov, setGuardandoMov] = React.useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        q, categoriaId, bajoStock: soloBajoStock ? "1" : "0",
      });
      const res = await fetch(`/api/inventario?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
      setCategorias(data.categorias);
      setResumen(data.resumen);
    } catch {
      toast.error("Error al cargar el inventario");
    } finally {
      setCargando(false);
    }
  }

  React.useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoriaId, soloBajoStock]);

  async function guardar(formData: FormData) {
    setGuardando(true);
    const id = formData.get("id") as string;
    const payload = {
      nombre: formData.get("nombre"),
      categoriaId: formData.get("categoriaId"),
      codigo: formData.get("codigo") || null,
      marca: formData.get("marca") || null,
      modelo: formData.get("modelo") || null,
      ubicacion: formData.get("ubicacion") || null,
      stock: Number(formData.get("stock")) || 0,
      stockMinimo: Number(formData.get("stockMinimo")) || 0,
      unidad: formData.get("unidad"),
      costoUnitario: Number(formData.get("costoUnitario")) || 0,
      precioVenta: Number(formData.get("precioVenta")) || 0,
      proveedor: formData.get("proveedor") || null,
    };

    try {
      const res = await fetch(id ? `/api/inventario/${id}` : "/api/inventario", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Error al guardar");
        return;
      }
      toast.success(id ? "Item actualizado" : "Item creado");
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
    if (!confirm("¿Dar de baja este item? El historial se conserva.")) return;
    const res = await fetch(`/api/inventario/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Item dado de baja");
      cargar();
    } else toast.error("No se pudo eliminar");
  }

  async function abrirMovimientos(item: Item) {
    setItemMovimiento(item);
    setMovimientos([]);
    const res = await fetch(`/api/inventario/${item.id}/movimientos`);
    if (res.ok) {
      const data = await res.json();
      setMovimientos(data.items);
    }
  }

  async function registrarMovimiento(formData: FormData) {
    if (!itemMovimiento) return;
    setGuardandoMov(true);
    try {
      const res = await fetch(`/api/inventario/${itemMovimiento.id}/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: formData.get("tipo"),
          cantidad: Number(formData.get("cantidad")),
          costoUnitario: formData.get("costoUnitario")
            ? Number(formData.get("costoUnitario"))
            : undefined,
          motivo: formData.get("motivo") || null,
          origen: formData.get("origen"),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Error al registrar el movimiento");
        return;
      }
      toast.success("Movimiento registrado");
      setItemMovimiento(null);
      await cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardandoMov(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi titulo="Valor del inventario" valor={formatCOP(resumen.valorTotal)} icono={Package} tono="info" />
        <Kpi titulo="Items activos" valor={resumen.totalItems} icono={Package} />
        <Kpi
          titulo="Stock bajo"
          valor={resumen.bajoStock}
          icono={AlertTriangle}
          tono={resumen.bajoStock > 0 ? "danger" : "success"}
          detalle={resumen.bajoStock > 0 ? "Requieren reposición" : "Todo en orden"}
        />
      </div>

      {/* Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar item, código, marca..." className="w-56 pl-10" />
          </div>
          <Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="w-44">
            <option value="TODAS">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={soloBajoStock}
              onChange={(e) => setSoloBajoStock(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Sólo stock bajo
          </label>
        </div>
        <Button onClick={() => { setEditando(null); setAbierto(true); }}>
          <Plus className="h-4 w-4" /> Nuevo item
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <div className="flex justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
          </div>
        ) : items.length === 0 ? (
          <Vacio titulo="Sin items" descripcion="Agrega el primer item al inventario." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden lg:table-cell">Costo unit.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 hidden lg:table-cell">Valor total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => {
                  const bajo = i.stock <= i.stockMinimo;
                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {i.nombre}
                          {bajo && <AlertTriangle className="ml-1.5 inline h-3.5 w-3.5 text-amber-500" />}
                        </div>
                        <div className="text-xs text-slate-500">
                          {i.codigo && `${i.codigo} · `}
                          {i.marca}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">
                        {i.categoria.nombre}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${bajo ? "text-amber-600" : "text-slate-900"}`}>
                          {formatNumero(i.stock)} {i.unidad.toLowerCase()}
                        </span>
                        <div className="text-[10px] text-slate-400">mín. {formatNumero(i.stockMinimo)}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-600">
                        {formatCOP(i.costoUnitario)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-slate-900">
                        {formatCOP(Math.round(i.stock * i.costoUnitario))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={() => abrirMovimientos(i)} title="Movimientos">
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={() => { setEditando(i); setAbierto(true); }} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => eliminar(i.id)} title="Dar de baja">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog nuevo/editar item */}
      <Dialog
        open={abierto}
        onClose={() => setAbierto(false)}
        title={editando ? "Editar item" : "Nuevo item de inventario"}
        size="md"
      >
        <form onSubmit={async (e) => { e.preventDefault(); await guardar(new FormData(e.currentTarget)); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" required>
              <Input name="nombre" defaultValue={editando?.nombre ?? ""} required />
            </Field>
            <Field label="Categoría" required>
              <Select name="categoriaId" defaultValue={editando?.categoriaId ?? ""} required>
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Código / SKU">
              <Input name="codigo" defaultValue={editando?.codigo ?? ""} />
            </Field>
            <Field label="Marca">
              <Input name="marca" defaultValue={editando?.marca ?? ""} />
            </Field>
            <Field label="Modelo">
              <Input name="modelo" defaultValue={editando?.modelo ?? ""} />
            </Field>
            <Field label="Ubicación">
              <Input name="ubicacion" defaultValue={editando?.ubicacion ?? ""} placeholder="Ej: Bodega A, estante 2" />
            </Field>
            {!editando && (
              <Field label="Stock inicial" hint="Se registra como entrada de compra">
                <Input type="number" name="stock" step="1" defaultValue="0" />
              </Field>
            )}
            <Field label="Stock mínimo" hint="Alerta cuando el stock llegue a este nivel">
              <Input type="number" name="stockMinimo" step="1"
                defaultValue={String(editando?.stockMinimo ?? 0)} />
            </Field>
            <Field label="Unidad de medida">
              <Select name="unidad" defaultValue={editando?.unidad ?? "UNIDAD"}>
                <option value="UNIDAD">Unidad</option>
                <option value="METRO">Metro</option>
                <option value="CAJA">Caja</option>
                <option value="ROLLO">Rollo</option>
                <option value="KG">Kilogramo</option>
                <option value="PAQUETE">Paquete</option>
              </Select>
            </Field>
            <Field label="Costo unitario (COP)">
              <Input type="number" name="costoUnitario" step="100"
                defaultValue={String(editando?.costoUnitario ?? 0)} />
            </Field>
            <Field label="Precio de venta (COP)">
              <Input type="number" name="precioVenta" step="100"
                defaultValue={String(editando?.precioVenta ?? 0)} />
            </Field>
            <Field label="Proveedor">
              <Input name="proveedor" defaultValue={editando?.proveedor ?? ""} />
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

      {/* Dialog de movimientos */}
      <Dialog
        open={Boolean(itemMovimiento)}
        onClose={() => setItemMovimiento(null)}
        title={`Movimientos · ${itemMovimiento?.nombre ?? ""}`}
        description={itemMovimiento ? `Stock actual: ${formatNumero(itemMovimiento.stock)} ${itemMovimiento.unidad.toLowerCase()}` : ""}
        size="lg"
      >
        {itemMovimiento && (
          <div className="space-y-5">
            {/* Formulario de nuevo movimiento */}
            <form
              onSubmit={async (e) => { e.preventDefault(); await registrarMovimiento(new FormData(e.currentTarget)); }}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Tipo">
                  <Select name="tipo" defaultValue="ENTRADA">
                    <option value="ENTRADA">Entrada</option>
                    <option value="SALIDA">Salida</option>
                    <option value="AJUSTE">Ajuste</option>
                    <option value="DEVOLUCION">Devolución</option>
                  </Select>
                </Field>
                <Field label="Cantidad" hint="Ajuste = stock final">
                  <Input type="number" name="cantidad" step="1" min="1" required />
                </Field>
                <Field label="Costo unitario">
                  <Input type="number" name="costoUnitario" step="100"
                    placeholder={String(itemMovimiento.costoUnitario)} />
                </Field>
                <Field label="Origen">
                  <Select name="origen" defaultValue="MANUAL">
                    <option value="MANUAL">Manual</option>
                    <option value="COMPRA">Compra</option>
                    <option value="VENTA">Venta</option>
                    <option value="INSTALACION">Instalación</option>
                    <option value="REVISION">Revisión</option>
                    <option value="DESMONTE">Desmonte</option>
                  </Select>
                </Field>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <Input name="motivo" placeholder="Motivo (opcional)" className="flex-1 bg-white" />
                <Button type="submit" variant="success" disabled={guardandoMov} size="md">
                  {guardandoMov ? "Registrando..." : "Registrar movimiento"}
                </Button>
              </div>
            </form>

            {/* Historial */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Historial</h4>
              {movimientos.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Sin movimientos.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Fecha</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Tipo</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Origen</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">Cant.</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">Stock final</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movimientos.map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                            {new Date(m.fecha).toLocaleDateString("es-CO")}
                          </td>
                          <td className="px-3 py-2">
                            <Badge tone={m.delta > 0 ? "success" : "danger"}>
                              {m.tipo}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">{m.origen}</td>
                          <td className={`px-3 py-2 text-right text-xs font-semibold ${m.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {m.delta > 0 ? "+" : ""}{formatNumero(m.delta)}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-slate-600">
                            {formatNumero(m.stockResultante)}
                          </td>
                          <td className="px-3 py-2 hidden md:table-cell text-xs text-slate-500">
                            {m.motivo ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
