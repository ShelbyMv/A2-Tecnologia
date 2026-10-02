"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavMenu } from "./nav-menu";
import { BotonSalir } from "./boton-salir";

export function AppShell({
  children,
  usuario,
  nombreEmpresa,
}: {
  children: React.ReactNode;
  usuario: { nombre: string; email: string };
  nombreEmpresa: string;
}) {
  const [abierto, setAbierto] = React.useState(false);
  const pathname = usePathname();

  // Cerrar el menú lateral al navegar en móvil.
  React.useEffect(() => setAbierto(false), [pathname]);

  return (
    <div className="min-h-screen">
      {/* Barra superior en móvil */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wifi className="h-4 w-4" />
          </div>
          <span className="font-semibold text-slate-900">{nombreEmpresa}</span>
        </div>
        <button
          onClick={() => setAbierto((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Menú lateral */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wifi className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {nombreEmpresa}
            </p>
            <p className="truncate text-xs text-slate-500">Sistema de gestión</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <NavMenu />
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium text-slate-900">
              {usuario.nombre}
            </p>
            <p className="truncate text-xs text-slate-500">{usuario.email}</p>
          </div>
          <BotonSalir />
        </div>
      </aside>

      {/* Tapa en móvil */}
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenido */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1600px] p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
