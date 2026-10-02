import { leerSesion } from "@/lib/sesion";
import { redirect } from "next/navigation";
import { ReciboView } from "./recibo-view";

export const dynamic = "force-dynamic";

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await leerSesion();
  if (!sesion) redirect("/login");

  const { id } = await params;

  return <ReciboView id={id} />;
}
