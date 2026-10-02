import { PageHeader } from "@/components/layout/page-header";
import { Kpi } from "@/components/ui/kpi";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, Wallet, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/formato";
import { rangoMesActual } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { desde, hasta } = rangoMesActual();

  const [
    clientesActivos,
    ingresosMes,
    cartera,
    stockTotal,
  ] = await Promise.all([
    prisma.cliente.count({ where: { estado: "ACTIVO" } }),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { fecha: { gte: desde, lte: hasta }, anulado: false },
    }),
    prisma.periodo.aggregate({
      _sum: { saldo: true },
      where: { estado: { in: ["ATRASADO", "PENDIENTE", "PARCIAL"] } },
    }),
    prisma.itemInventario.count({ where: { activo: true } }),
  ]);

  return (
    <>
      <PageHeader
        titulo="Panel"
        descripcion="Resumen general de la operación"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titulo="Clientes activos"
          valor={clientesActivos}
          icono={Users}
          tono="info"
        />
        <Kpi
          titulo="Ingresos del mes"
          valor={formatCOP(ingresosMes._sum.monto ?? 0)}
          icono={CreditCard}
          tono="success"
        />
        <Kpi
          titulo="Cartera por cobrar"
          valor={formatCOP(cartera._sum.saldo ?? 0)}
          icono={Wallet}
          tono="danger"
        />
        <Kpi
          titulo="Items en inventario"
          valor={stockTotal}
          icono={Package}
        />
      </div>

      <Card className="mt-6">
        <CardContent className="py-10 text-center text-sm text-slate-500">
          El resto del panel se construirá en las siguientes fases.
        </CardContent>
      </Card>
    </>
  );
}
