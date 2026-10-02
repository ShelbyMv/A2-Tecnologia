import { redirect } from "next/navigation";
import { requiereSesion } from "@/lib/sesion";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await requiereSesion();

  const config = await prisma.config.findUnique({ where: { id: 1 } });

  return (
    <AppShell
      usuario={{ nombre: sesion.nombre, email: sesion.email }}
      nombreEmpresa={config?.nombreEmpresa ?? "A2 Tecnología"}
    >
      {children}
    </AppShell>
  );
}
