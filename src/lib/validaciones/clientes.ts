import { z } from "zod";

const frecuenciaSchema = z.enum(["MENSUAL", "QUINCENAL"]);
const estadoClienteSchema = z.enum(["ACTIVO", "SUSPENDIDO", "INACTIVO", "DESMONTADO"]);

export const clienteSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido").max(100),
  documento: z.string().max(20).optional().nullable(),
  telefono: z.string().max(30).optional().nullable(),
  direccion: z.string().max(200).optional().nullable(),
  zona: z.string().max(100).optional().nullable(),
  barrio: z.string().max(100).optional().nullable(),
  email: z.string().email("Email inválido").max(150).optional().nullable(),
  planId: z.string().optional().nullable(),
  frecuencia: frecuenciaSchema.default("MENSUAL"),
  valorCuota: z.coerce.number().int().min(0).default(0),
  ip: z.string().max(45).optional().nullable(),
  mac: z.string().max(20).optional().nullable(),
  equipoDesc: z.string().max(100).optional().nullable(),
  fechaInstalacion: z.string().optional().nullable(),
  fechaActivacion: z.string().optional().nullable(),
  fechaInicioPago: z.string().optional().nullable(),
  estado: estadoClienteSchema.default("ACTIVO"),
  notas: z.string().optional().nullable(),
});

export const planSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido").max(80),
  velocidadBajada: z.string().max(30).optional().nullable(),
  velocidadSubida: z.string().max(30).optional().nullable(),
  valorMensual: z.coerce.number().int().min(0).default(0),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
export type PlanInput = z.infer<typeof planSchema>;