"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wrench,
  ClipboardCheck,
  Unplug,
  Wallet,
  Package,
  Signal,
  FileUp,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  exacto?: boolean;
};

const SECCIONES: { titulo: string; items: Item[] }[] = [
  {
    titulo: "General",
    items: [
      { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
    ],
  },
  {
    titulo: "Operación",
    items: [
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/pagos", label: "Pagos", icon: CreditCard },
      { href: "/instalaciones", label: "Instalaciones", icon: Wrench },
      { href: "/revisiones", label: "Revisiones", icon: ClipboardCheck },
      { href: "/desmontes", label: "Desmontes", icon: Unplug },
    ],
  },
  {
    titulo: "Finanzas",
    items: [
      { href: "/contabilidad", label: "Contabilidad", icon: Wallet },
      { href: "/inventario", label: "Inventario", icon: Package },
    ],
  },
  {
    titulo: "Ajustes",
    items: [
      { href: "/importar", label: "Importar Excel", icon: FileUp },
      { href: "/planes", label: "Planes", icon: Signal },
      { href: "/configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

export function NavMenu() {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {SECCIONES.map((seccion) => (
        <div key={seccion.titulo}>
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {seccion.titulo}
          </p>
          <ul className="space-y-0.5">
            {seccion.items.map((item) => {
              const activo = item.exacto
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icono = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      activo
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <Icono
                      className={cn(
                        "h-4 w-4 shrink-0",
                        activo ? "text-blue-600" : "text-slate-400",
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
