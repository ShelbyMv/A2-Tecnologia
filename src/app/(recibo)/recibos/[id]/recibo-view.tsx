"use client";

import * as React from "react";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/formato";

type Periodo = { codigo: string; fechaVencimiento: string; monto: number };

type Pago = {
  id: string;
  numeroRecibo: number | null;
  fecha: string;
  monto: number;
  metodo: string;
  referencia: string | null;
  concepto: string | null;
  nota: string | null;
  montoEmpresa: number;
  montoDueno: number;
  anulado: boolean;
  cliente: { nombre: string; documento: string | null; direccion: string | null; telefono: string | null };
  aplicaciones: { periodo: Periodo; monto: number }[];
};

type Config = {
  nombreEmpresa: string;
  nit: string | null;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  conceptoEmpresa: string;
  conceptoDueno: string;
} | null;

export function ReciboView({ id }: { id: string }) {
  const [pago, setPago] = React.useState<Pago | null>(null);
  const [config, setConfig] = React.useState<Config>(null);
  const [cargando, setCargando] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/recibo/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPago(data.pago);
          setConfig(data.config);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="flex justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando recibo...
      </div>
    );
  }

  if (!pago) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">No se encontró el pago.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Barra de acciones (no se imprime) */}
      <div className="no-print mb-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button variant="primary" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
        </Button>
      </div>

      {pago.anulado && (
        <div className="no-print mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-700">
          ESTE PAGO ESTÁ ANULADO
        </div>
      )}

      {/* Recibo */}
      <div className="mx-auto max-w-md rounded-xl border border-slate-300 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        {/* Encabezado */}
        <div className="text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide text-slate-900">
            {config?.nombreEmpresa ?? "A2 Tecnología"}
          </h1>
          {config?.nit && <p className="text-xs text-slate-500">NIT {config.nit}</p>}
          {config?.direccion && <p className="text-xs text-slate-500">{config.direccion}</p>}
          {config?.telefono && <p className="text-xs text-slate-500">Tel. {config.telefono}</p>}
        </div>

        <div className="my-4 border-t-2 border-dashed border-slate-300" />

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">RECIBO DE PAGO</h2>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
            Nº {String(pago.numeroRecibo ?? 0).padStart(6, "0")}
          </span>
        </div>

        {/* Datos del cliente */}
        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Recibido de:</span>
            <span className="font-semibold text-slate-900">{pago.cliente.nombre}</span>
          </div>
          {pago.cliente.documento && (
            <div className="flex justify-between">
              <span className="text-slate-500">Documento:</span>
              <span className="text-slate-900">{pago.cliente.documento}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Fecha:</span>
            <span className="text-slate-900">
              {new Date(pago.fecha).toLocaleDateString("es-CO", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Forma de pago:</span>
            <span className="text-slate-900">{pago.metodo}</span>
          </div>
          {pago.referencia && (
            <div className="flex justify-between">
              <span className="text-slate-500">Referencia:</span>
              <span className="text-slate-900">{pago.referencia}</span>
            </div>
          )}
        </div>

        {/* Concepto y periodos */}
        <div className="mt-5 rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concepto</p>
          <p className="mt-1 text-sm text-slate-900">
            {pago.concepto ??
              pago.aplicaciones.map((a) => `Corte ${a.periodo.codigo}`).join(", ") ??
              "Pago de servicio de internet"}
          </p>
          {pago.aplicaciones.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {pago.aplicaciones.map((a) => (
                <li key={a.periodo.codigo} className="flex justify-between">
                  <span>
                    Corte {a.periodo.codigo} (vence{" "}
                    {new Date(a.periodo.fechaVencimiento).toLocaleDateString("es-CO")})
                  </span>
                  <span>{formatCOP(a.monto)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Total */}
        <div className="mt-5 rounded-lg border-2 border-slate-900 p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total pagado</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{formatCOP(pago.monto)}</p>
        </div>

        {/* Reparto interno */}
        <div className="mt-4 rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
          <p className="mb-1 font-semibold uppercase tracking-wide">Uso interno — no mostrar al cliente</p>
          <div className="flex justify-between">
            <span>{config?.conceptoEmpresa ?? "Parte empresa"}:</span>
            <span>{formatCOP(pago.montoEmpresa)}</span>
          </div>
          <div className="flex justify-between">
            <span>{config?.conceptoDueno ?? "Ganancia del dueño"}:</span>
            <span>{formatCOP(pago.montoDueno)}</span>
          </div>
        </div>

        {pago.nota && (
          <div className="mt-4 text-xs text-slate-600">
            <span className="font-semibold">Nota: </span>
            {pago.nota}
          </div>
        )}

        {/* Firma */}
        <div className="mt-10 border-t border-slate-400 pt-1 text-center text-xs text-slate-500">
          Firma de quien recibe
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-400">
          Gracias por su pago — {config?.nombreEmpresa ?? "A2 Tecnología"}
          {config?.email ? ` · ${config.email}` : ""}
        </p>
      </div>
    </div>
  );
}
