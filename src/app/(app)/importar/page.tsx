"use client";

import * as React from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type Fila = Record<string, unknown>;
type Resultado = {
  ok: boolean;
  creados: number;
  actualizados: number;
  periodosCreados: number;
  errores: { fila: number; nombre?: string; error: string }[];
  total: number;
};

const COLUMNAS_ESPERADAS = [
  "nombre", "documento", "telefono", "direccion", "zona", "barrio",
  "email", "plan", "frecuencia", "valorCuota", "ip", "mac", "equipo",
  "fechaInstalacion", "fechaInicioPago", "estado",
];

export default function ImportarPage() {
  const [filas, setFilas] = React.useState<Fila[] | null>(null);
  const [encabezados, setEncabezados] = React.useState<string[]>([]);
  const [generarPeriodos, setGenerarPeriodos] = React.useState(true);
  const [importando, setImportando] = React.useState(false);
  const [resultado, setResultado] = React.useState<Resultado | null>(null);

  async function leerArchivo(archivo: File) {
    try {
      const XLSX = await import("xlsx");
      const buffer = await archivo.arrayBuffer();
      const libro = XLSX.read(buffer, { type: "array" });

      // Usa la primera hoja que tenga datos.
      let filasLeidas: Fila[] = [];
      let headers: string[] = [];

      for (const nombre of libro.SheetNames) {
        const hoja = libro.Sheets[nombre];
        const json = XLSX.utils.sheet_to_json<Fila>(hoja, { defval: "" });
        if (json.length > 0) {
          filasLeidas = json;
          headers = Object.keys(json[0]);
          break;
        }
      }

      if (filasLeidas.length === 0) {
        toast.error("El archivo no tiene datos en ninguna hoja");
        return;
      }

      setFilas(filasLeidas);
      setEncabezados(headers);
      setResultado(null);
      toast.success(`${filasLeidas.length} filas leídas`);
    } catch {
      toast.error("No se pudo leer el archivo. Debe ser .xlsx o .csv");
    }
  }

  async function importar() {
    if (!filas) return;
    setImportando(true);
    try {
      const res = await fetch("/api/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filas, generarPeriodos }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al importar");
        return;
      }
      setResultado(data);
      toast.success(
        `Importación lista: ${data.creados} nuevos, ${data.actualizados} actualizados`,
      );
    } catch {
      toast.error("Error de conexión");
    } finally {
      setImportando(false);
    }
  }

  function descargarPlantilla() {
    (async () => {
      const XLSX = await import("xlsx");
      const ejemplo = [
        {
          nombre: "Juan Pérez",
          documento: "1020304050",
          telefono: "3101234567",
          direccion: "Calle 5 # 12-34",
          zona: "Centro",
          barrio: "La Esperanza",
          email: "juan@correo.com",
          plan: "Hogar 30 Mbps",
          frecuencia: "MENSUAL",
          valorCuota: 40000,
          ip: "192.168.50.10",
          mac: "AA:BB:CC:DD:EE:FF",
          equipo: "Router WiFi 4GF",
          fechaInstalacion: "15/03/2026",
          fechaInicioPago: "15/03/2026",
          estado: "ACTIVO",
        },
      ];
      const hoja = XLSX.utils.json_to_sheet(ejemplo, { header: COLUMNAS_ESPERADAS });
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Clientes");
      XLSX.writeFile(libro, "plantilla-clientes-a2.xlsx");
    })();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Importar desde Excel</h1>
        <p className="text-sm text-slate-500">
          Sube tu archivo .xlsx o .csv de clientes. El sistema detecta las columnas por su nombre.
        </p>
      </div>

      {/* Paso 1: subir archivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            Paso 1 · Sube tu archivo
          </CardTitle>
          <CardDescription>
            Las columnas se detectan por nombre: nombre, documento, telefono, direccion, plan,
            frecuencia, valorCuota, fechaInstalacion, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              <Upload className="h-4 w-4" />
              Seleccionar archivo
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) leerArchivo(f);
                }}
              />
            </label>
            <Button variant="outline" onClick={descargarPlantilla}>
              <Download className="h-4 w-4" />
              Descargar plantilla de ejemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Paso 2: vista previa */}
      {filas && !resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2 · Vista previa ({filas.length} filas)</CardTitle>
            <CardDescription>
              Revisa que los datos se hayan leído bien antes de importar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={generarPeriodos}
                onChange={(e) => setGenerarPeriodos(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Generar los cortes de pago del año para cada cliente (según su frecuencia y fecha de inicio)
            </label>

            <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    {encabezados.map((h) => (
                      <th key={h} className="border-b border-slate-200 px-2.5 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.slice(0, 20).map((f, i) => (
                    <tr key={i}>
                      {encabezados.map((h) => (
                        <td key={h} className="px-2.5 py-1.5 text-slate-700 whitespace-nowrap max-w-[160px] truncate">
                          {String(f[h] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filas.length > 20 && (
              <p className="mt-2 text-xs text-slate-500">
                Mostrando las primeras 20 de {filas.length} filas.
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <Button onClick={importar} disabled={importando} size="lg">
                {importando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Importar {filas.length} clientes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: resultado */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Importación completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Total filas</p>
                <p className="text-lg font-bold text-slate-900">{resultado.total}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <p className="text-xs text-emerald-600">Clientes nuevos</p>
                <p className="text-lg font-bold text-emerald-700">{resultado.creados}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-xs text-blue-600">Actualizados</p>
                <p className="text-lg font-bold text-blue-700">{resultado.actualizados}</p>
              </div>
              <div className="rounded-lg bg-violet-50 p-3 text-center">
                <p className="text-xs text-violet-600">Cortes generados</p>
                <p className="text-lg font-bold text-violet-700">{resultado.periodosCreados}</p>
              </div>
            </div>

            {resultado.errores.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  {resultado.errores.length} filas con problemas
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-amber-700">
                  {resultado.errores.map((e, i) => (
                    <li key={i}>
                      Fila {e.fila}{e.nombre ? ` (${e.nombre})` : ""}: {e.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setFilas(null); setResultado(null); }}>
                Importar otro archivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
