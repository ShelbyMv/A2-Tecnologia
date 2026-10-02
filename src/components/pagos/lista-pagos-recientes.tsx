"use client";

import * as React from "react";
import { Receipt, Loader2 } from "lucide-react";
import { formatCOP } from "@/lib/formato";

type Pago = {
  id: string;
  numeroRecibo: number | null;
  fecha: string;
  monto: number;
  metodo: string;
  concepto: string | null;
  anulado: boolean;
  cliente: { nombre: string };
};

export function ListaPagosRecientes() {
  const [pagos, setPagos] = React.useState<Pago[] | null>(null);

  React.useEffect(() => {
    fetch("/api/pagos?pageSize=15")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPagos(d?.items ?? []))
      .catch(() => setPagos([]));
  }, []);

  if (pagos === null) {
    return (
      <div className="flex justify-center gap-2 rounded-xl border border-slate-200 bg-white py-10 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando pagos recientes...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Receipt className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Últimos pagos recibidos</h3>
      </div>
      {pagos.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          Aún no hay pagos registrados. Haz clic en una celda de la matriz para registrar el primero.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Recibo</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Cliente</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Concepto</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500 hidden md:table-cell">Fecha</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">Monto</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">Recibo PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50 ${p.anulado ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-900">
                    #{String(p.numeroRecibo ?? 0).padStart(6, "0")}
                    {p.anulado && <span className="ml-1.5 text-xs text-red-600">(anulado)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-900">{p.cliente.nombre}</td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-sm text-slate-500">
                    <div className="max-w-[260px] truncate">{p.concepto ?? "—"}</div>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-sm text-slate-600 whitespace-nowrap">
                    {new Date(p.fecha).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-600">
                    {formatCOP(p.monto)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <a
                      href={`/recibos/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
