import { cn } from "@/lib/utils";

/** Cabecera de página: título, descripción y acciones a la derecha. */
export function PageHeader({
  titulo,
  descripcion,
  acciones,
  className,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>
        )}
      </div>
      {acciones && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div>
      )}
    </div>
  );
}
