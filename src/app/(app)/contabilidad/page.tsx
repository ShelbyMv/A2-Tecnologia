import { PageHeader } from "@/components/layout/page-header";
import { ContabilidadView } from "@/components/contabilidad/contabilidad-view";

export const dynamic = "force-dynamic";

export default function ContabilidadPage() {
  return (
    <>
      <PageHeader
        titulo="Contabilidad"
        descripcion="Ingresos, egresos y ganancia neta del negocio"
      />
      <ContabilidadView />
    </>
  );
}
