import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion } from "@/lib/sesion";
import { pagoSchema } from "@/lib/validaciones/pagos";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requiereSesion();

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "50"));

    const where: any = { anulado: false };
    if (clienteId) where.clienteId = clienteId;

    const [items, total] = await Promise.all([
      prisma.pago.findMany({
        where,
        orderBy: { fecha: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          cliente: { select: { id: true, nombre: true } },
          aplicaciones: { include: { periodo: true } },
        },
      }),
      prisma.pago.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al obtener pagos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requiereSesion();

    const body = await request.json();
    const parse = pagoSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parse.data;

    // Obtener config para el monto de empresa
    const config = await prisma.config.findUnique({ where: { id: 1 } });
    const montoEmpresa = config?.montoEmpresa ?? 40000;

    const pago = await prisma.$transaction(async (tx) => {
      // Obtener el siguiente número de recibo
      const cfg = await tx.config.findUnique({ where: { id: 1 } });
      const nuevoRecibo = (cfg?.consecutiveRecibo ?? 1);
      await tx.config.update({
        where: { id: 1 },
        data: { consecutiveRecibo: { increment: 1 } },
      });

      const montoE = Math.min(montoEmpresa, data.monto);
      const montoD = data.monto - montoE;

      const nuevo = await tx.pago.create({
        data: {
          clienteId: data.clienteId,
          fecha: new Date(data.fecha),
          monto: data.monto,
          metodo: data.metodo,
          referencia: data.referencia ?? null,
          concepto: data.concepto ?? null,
          nota: data.nota ?? null,
          montoEmpresa: montoE,
          montoDueno: montoD,
          numeroRecibo: nuevoRecibo,
        },
      });

      // Aplicar a periodos si se proveyeron
      if (data.aplicaciones && data.aplicaciones.length > 0) {
        for (const app of data.aplicaciones) {
          const periodo = await tx.periodo.findUnique({
            where: { id: app.periodoId },
          });
          if (!periodo) continue;

          await tx.aplicacionPago.create({
            data: {
              pagoId: nuevo.id,
              periodoId: app.periodoId,
              monto: app.monto,
            },
          });

          const nuevoPagado = periodo.pagado + app.monto;
          const nuevoSaldo = Math.max(0, periodo.monto - nuevoPagado);

          let nuevoEstado = periodo.estado;
          if (nuevoSaldo === 0) nuevoEstado = "PAGADO";
          else if (nuevoPagado > 0) nuevoEstado = "PARCIAL";
          else if (periodo.fechaVencimiento < new Date()) nuevoEstado = "ATRASADO";

          await tx.periodo.update({
            where: { id: app.periodoId },
            data: {
              pagado: nuevoPagado,
              saldo: nuevoSaldo,
              estado: nuevoEstado,
              fechaPago: nuevoEstado === "PAGADO" ? new Date(data.fecha) : periodo.fechaPago,
            },
          });
        }
      }

      // Crear transacción contable automática
      const catIngreso = await tx.categoriaTransaccion.findFirst({
        where: { nombre: "Ingresos por Internet" },
      });
      if (catIngreso) {
        await tx.transaccion.create({
          data: {
            fecha: new Date(data.fecha),
            tipo: "INGRESO",
            categoriaId: catIngreso.id,
            concepto: `${data.concepto ?? "Pago"} - Recibo #${nuevoRecibo}`,
            monto: data.monto,
            clienteId: data.clienteId,
            pagoId: nuevo.id,
            montoEmpresa: montoE,
            montoDueno: montoD,
            metodo: "Automático",
            automatica: true,
          },
        });
      }

      return nuevo;
    });

    return NextResponse.json(pago, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al registrar pago" },
      { status: 500 },
    );
  }
}