import { PageHeader } from "@/components/layout/page-header";
import { MatrizPagos } from "@/components/pagos/matriz-pagos";
import { ListaPagosRecientes } from "@/components/pagos/lista-pagos-recientes";

export const dynamic = "force-dynamic";

export default function PagosPage() {
  return (
    <>
      <PageHeader
        titulo="Pagos"
        descripcion="Haz clic en una celda para registrar el pago del cliente en ese corte"
      />
      <MatrizPagos />
      <div className="mt-5">
        <ListaPagosRecientes />
      </div>
    </>
  );
}
