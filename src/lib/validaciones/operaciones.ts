import { z } from "zod";

export const instalacionSchema = z.object({
  clienteId: z.string().min(1, "Cliente requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  fechaProgramada: z.string().optional().nullable(),
  fechaCompletada: z.string().optional().nullable(),
  tipo: z.enum(["NUEVA", "REINSTALACION", "TRASLADO", "CAMBIO_PLAN"]).default("NUEVA"),
  estado: z.enum(["PENDIENTE", "PROGRAMADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"]).default("PENDIENTE"),
  zona: z.string().max(100).optional().nullable(),
  direccion: z.string().max(200).optional().nullable(),
  referencia: z.string().max(200).optional().nullable(),
  telefono: z.string().max(30).optional().nullable(),
  valorInstalacion: z.coerce.number().int().min(0).default(0),
  manoObra: z.coerce.number().int().min(0).default(0),
  routerDesc: z.string().max(100).optional().nullable(),
  mac: z.string().max(20).optional().nullable(),
  ip: z.string().max(45).optional().nullable(),
  longitudCable: z.coerce.number().optional().nullable(),
  observacion: z.string().optional().nullable(),
  recibidoPor: z.string().max(100).optional().nullable(),
});

export const revisionSchema = z.object({
  clienteId: z.string().min(1, "Cliente requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  tipo: z.enum(["RUTINA", "CORRECTIVA", "INSTALACION", "REACTIVACION", "OTRO"]).default("RUTINA"),
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "COMPLETADA", "CANCELADA"]).default("PENDIENTE"),
  motivo: z.string().max(300).optional().nullable(),
  diagnostico: z.string().optional().nullable(),
  solucion: z.string().optional().nullable(),
  duracionMin: z.coerce.number().int().min(0).optional().nullable(),
  senalDbm: z.coerce.number().optional().nullable(),
  velocidadBajada: z.string().max(30).optional().nullable(),
  velocidadSubida: z.string().max(30).optional().nullable(),
  valorCobrado: z.coerce.number().int().min(0).default(0),
  proximaRevision: z.string().optional().nullable(),
  observacion: z.string().optional().nullable(),
  tecnico: z.string().max(100).optional().nullable(),
});

export const desmonteSchema = z.object({
  clienteId: z.string().min(1, "Cliente requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  motivo: z.enum(["NO_PAGO", "RENUNCIA", "FALLA", "CAMBIO_PLAN", "INACTIVO", "TRASLADO", "OTRO"]).default("NO_PAGO"),
  estado: z.enum(["PENDIENTE", "PROGRAMADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"]).default("PENDIENTE"),
  direccion: z.string().max(200).optional().nullable(),
  zona: z.string().max(100).optional().nullable(),
  routerDesc: z.string().max(100).optional().nullable(),
  mac: z.string().max(20).optional().nullable(),
  saldoFavor: z.coerce.number().int().min(0).default(0),
  valorEquipos: z.coerce.number().int().min(0).default(0),
  observacion: z.string().optional().nullable(),
  tecnico: z.string().max(100).optional().nullable(),
  equipos: z.array(
    z.object({
      tipo: z.string().min(1),
      marca: z.string().optional().nullable(),
      modelo: z.string().optional().nullable(),
      mac: z.string().optional().nullable(),
      estado: z.enum(["FUNCIONAL", "DANADO", "NO_APORTA", "PERDIDO"]).default("FUNCIONAL"),
      valor: z.coerce.number().int().min(0).default(0),
      nota: z.string().optional().nullable(),
    }),
  ).optional(),
});

export type InstalacionInput = z.infer<typeof instalacionSchema>;
export type RevisionInput = z.infer<typeof revisionSchema>;
export type DesmonteInput = z.infer<typeof desmonteSchema>;
