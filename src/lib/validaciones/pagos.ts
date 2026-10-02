import { z } from "zod";

export const metodoPagoSchema = z.enum([
  "EFECTIVO",
  "TRANSFERENCIA",
  "NEQUI",
  "DAVIPLATA",
  "WOMPI",
  "OTRO",
]);

export const estadoPeriodoSchema = z.enum([
  "PENDIENTE",
  "PAGADO",
  "PARCIAL",
  "ATRASADO",
  "FUTURO",
  "ANULADO",
  "EXONERADO",
]);

export const pagoSchema = z.object({
  clienteId: z.string().min(1, "Cliente requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  monto: z.coerce.number().int().min(1, "Monto debe ser mayor a 0"),
  metodo: metodoPagoSchema.default("EFECTIVO"),
  referencia: z.string().max(100).optional().nullable(),
  concepto: z.string().max(200).optional().nullable(),
  nota: z.string().optional().nullable(),
  aplicaciones: z.array(
    z.object({
      periodoId: z.string(),
      monto: z.coerce.number().int().min(1),
    }),
  ).optional(),
});

export type PagoInput = z.infer<typeof pagoSchema>;