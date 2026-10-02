"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function BotonSalir() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function salir() {
    setCargando(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("No se pudo cerrar la sesión");
      setCargando(false);
    }
  }

  return (
    <button
      onClick={salir}
      disabled={cargando}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4 text-slate-400" />
      {cargando ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
