import { redirect } from "next/navigation";
import { leerSesion } from "@/lib/sesion";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const sesion = await leerSesion();
  if (sesion) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <LoginForm />
    </div>
  );
}
