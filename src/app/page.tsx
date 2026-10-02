import { redirect } from "next/navigation";
import { leerSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sesion = await leerSesion();
  redirect(sesion ? "/dashboard" : "/login");
}
