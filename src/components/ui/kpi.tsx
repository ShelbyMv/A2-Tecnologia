import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/** Tarjeta de indicador: un número grande con su etiqueta. */
export function Kpi({
  titulo,
  valor,
  detalle,
  icono: Icono,
  tono = "default",
  className,
}: {
  titulo: string;
  valor: string | number;
  detalle?: string;
  icono?: LucideIcon;
  tono?: "default" | "success" | "danger" | "warning" | "info";
  className?: string;
}) {
  const tonos = {
    default: "text-slate-900",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };
  const fondos = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-600",
    danger: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-blue-50 text-blue-600",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 uppercase tracking-wide">
            {titulo}
          </p>
          <p className={cn("mt-1.5 text-2xl font-bold tracking-tight", tonos[tono])}>
            {valor}
          </p>
          {detalle && (
            <p className="mt-1 truncate text-xs text-slate-500">{detalle}</p>
          )}
        </div>
        {Icono && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              fondos[tono],
            )}
          >
            <Icono className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Estado vacío con icono, cuando una lista no tiene registros. */
export function Vacio({
  icono: Icono,
  titulo,
  descripcion,
  accion,
}: {
  icono?: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {Icono && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icono className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
      {descripcion && (
        <p className="max-w-sm text-sm text-slate-500">{descripcion}</p>
      )}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
