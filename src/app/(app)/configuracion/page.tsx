"use client";

import * as React from "react";
import { Save, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type Config = {
  nombreEmpresa: string;
  nit: string | null;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  montoEmpresa: number;
  conceptoEmpresa: string;
  conceptoDueno: string;
  diasGracia: number;
};

export default function ConfiguracionPage() {
  const [config, setConfig] = React.useState<Config | null>(null);
  const [guardando, setGuardando] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then(setConfig)
      .catch(() => toast.error("Error al cargar la configuración"));
  }, []);

  async function guardar(formData: FormData) {
    setGuardando(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEmpresa: formData.get("nombreEmpresa"),
          nit: formData.get("nit") || null,
          telefono: formData.get("telefono") || null,
          direccion: formData.get("direccion") || null,
          email: formData.get("email") || null,
          montoEmpresa: Number(formData.get("montoEmpresa")) || 0,
          conceptoEmpresa: formData.get("conceptoEmpresa"),
          conceptoDueno: formData.get("conceptoDueno"),
          diasGracia: Number(formData.get("diasGracia")) || 5,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Error al guardar");
        return;
      }
      toast.success("Configuración guardada");
      setConfig(result);
      // Refrescar el layout para que el nombre de la empresa se actualice.
      window.location.reload();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  if (!config) {
    return (
      <div className="flex justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
      </div>
    );
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Datos de la empresa y parámetros del negocio</p>
      </div>

      <form onSubmit={async (e) => { e.preventDefault(); await guardar(new FormData(e.currentTarget)); }}>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Datos de la empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Datos de la empresa
              </CardTitle>
              <CardDescription>Aparecen en los recibos y reportes</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Nombre de la empresa" required>
                <Input name="nombreEmpresa" defaultValue={config.nombreEmpresa} required />
              </Field>
              <Field label="NIT / RUT">
                <Input name="nit" defaultValue={config.nit ?? ""} />
              </Field>
              <Field label="Teléfono">
                <Input name="telefono" defaultValue={config.telefono ?? ""} />
              </Field>
              <Field label="Dirección">
                <Input name="direccion" defaultValue={config.direccion ?? ""} />
              </Field>
              <Field label="Email">
                <Input type="email" name="email" defaultValue={config.email ?? ""} />
              </Field>
            </CardContent>
          </Card>

          {/* Parámetros del negocio */}
          <Card>
            <CardHeader>
              <CardTitle>Parámetros del negocio</CardTitle>
              <CardDescription>Reparto de ingresos y tolerancia de mora</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field
                label="Monto fijo para la empresa (COP)"
                hint="De cada pago, esta parte fija va a la empresa y el resto es tu ganancia"
              >
                <Input type="number" name="montoEmpresa" step="1000"
                  defaultValue={String(config.montoEmpresa)} />
              </Field>
              <Field label="Etiqueta de la parte de la empresa">
                <Input name="conceptoEmpresa" defaultValue={config.conceptoEmpresa} />
              </Field>
              <Field label="Etiqueta de tu ganancia">
                <Input name="conceptoDueno" defaultValue={config.conceptoDueno} />
              </Field>
              <Field
                label="Días de tolerancia de mora"
                hint="Días después del vencimiento antes de marcar el pago como atrasado"
              >
                <Input type="number" name="diasGracia" min="0" max="30"
                  defaultValue={String(config.diasGracia)} />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit" size="lg" disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Guardar configuración
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
