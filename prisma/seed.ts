import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLANES = [
  { nombre: "Básico 10 Mbps", velocidadBajada: "10 Mbps", velocidadSubida: "5 Mbps", valorMensual: 25000, descripcion: "Ideal para navegación y redes sociales" },
  { nombre: "Hogar 20 Mbps", velocidadBajada: "20 Mbps", velocidadSubida: "10 Mbps", valorMensual: 35000, descripcion: "Streaming en HD y videollamadas" },
  { nombre: "Hogar 30 Mbps", velocidadBajada: "30 Mbps", velocidadSubida: "15 Mbps", valorMensual: 40000, descripcion: "Plan más solicitado" },
  { nombre: "Hogar 50 Mbps", velocidadBajada: "50 Mbps", velocidadSubida: "25 Mbps", valorMensual: 50000, descripcion: "Para hogares con muchos dispositivos" },
  { nombre: "Gamer 80 Mbps", velocidadBajada: "80 Mbps", velocidadSubida: "40 Mbps", valorMensual: 70000, descripcion: "Baja latencia para gaming" },
  { nombre: "Empresarial 100 Mbps", velocidadBajada: "100 Mbps", velocidadSubida: "50 Mbps", valorMensual: 90000, descripcion: "Negocios y oficinas" },
];

const CATEGORIAS_CONTABILIDAD = [
  { nombre: "Ingresos por Internet", tipo: "INGRESO" as const, color: "#22c55e" },
  { nombre: "Ingresos por instalación", tipo: "INGRESO" as const, color: "#84cc16" },
  { nombre: "Ingresos por equipos", tipo: "INGRESO" as const, color: "#eab308" },
  { nombre: "Otros ingresos", tipo: "INGRESO" as const, color: "#a3e635" },
  { nombre: "Internet y operación", tipo: "EGRESO" as const, color: "#ef4444" },
  { nombre: "Energía eléctrica", tipo: "EGRESO" as const, color: "#f97316" },
  { nombre: "Mantenimiento de red", tipo: "EGRESO" as const, color: "#f59e0b" },
  { nombre: "Transporte y gasolina", tipo: "EGRESO" as const, color: "#eab308" },
  { nombre: "Herramientas y materiales", tipo: "EGRESO" as const, color: "#84cc16" },
  { nombre: "Compra de equipos", tipo: "EGRESO" as const, color: "#22c55e" },
  { nombre: "Nómina y servicios", tipo: "EGRESO" as const, color: "#10b981" },
  { nombre: "Publicidad y marketing", tipo: "EGRESO" as const, color: "#3b82f6" },
  { nombre: "Impuestos y tasas", tipo: "EGRESO" as const, color: "#8b5cf6" },
  { nombre: "Otros gastos", tipo: "EGRESO" as const, color: "#64748b" },
];

const CATEGORIAS_INVENTARIO = [
  { nombre: "Routers y ONT", descripcion: "Equipos que se instalan en casa del cliente" },
  { nombre: "Cables UTP", descripcion: "Cable de red, rollos y cortes" },
  { nombre: "Conectores y patching", descripcion: "RJ45, patch panel, keystones" },
  { nombre: "Adaptadores y fuentes", descripcion: "Cargadores, inyectores, fuentes" },
  { nombre: "Antenas y torres", descripcion: "Antenas, soportes y torres" },
  { nombre: "Herramientas", descripcion: "Herramientas de instalación y mantenimiento" },
  { nombre: "Equipos de red", descripcion: "Switches, access points, repetidores" },
  { nombre: "Otros", descripcion: "Elementos varios" },
];

const ITEMS_INVENTARIO = [
  { nombre: "Router WiFi 4GF", categoria: "Routers y ONT", codigo: "RT-4GF", stock: 18, stockMinimo: 5, unidad: "UNIDAD" as const, costoUnitario: 65000 },
  { nombre: "Router WiFi 6 AX", categoria: "Routers y ONT", codigo: "RT-AX6", stock: 8, stockMinimo: 3, unidad: "UNIDAD" as const, costoUnitario: 110000 },
  { nombre: "ONT GPON Fibra Óptica", categoria: "Routers y ONT", codigo: "ONT-GP", stock: 4, stockMinimo: 2, unidad: "UNIDAD" as const, costoUnitario: 85000 },
  { nombre: "Cable UTP Cat 6 (rollo 305 m)", categoria: "Cables UTP", codigo: "CB-UTP6", stock: 6, stockMinimo: 2, unidad: "ROLLO" as const, costoUnitario: 145000 },
  { nombre: "Conector RJ45 Cat 6 (caja)", categoria: "Conectores y patching", codigo: "RJ45-C6", stock: 22, stockMinimo: 8, unidad: "CAJA" as const, costoUnitario: 12000 },
  { nombre: "Patch panel 24 puertos", categoria: "Conectores y patching", codigo: "PP-24", stock: 3, stockMinimo: 2, unidad: "UNIDAD" as const, costoUnitario: 55000 },
  { nombre: "Adaptador de corriente 12V 1A", categoria: "Adaptadores y fuentes", codigo: "AD-12V", stock: 25, stockMinimo: 10, unidad: "UNIDAD" as const, costoUnitario: 8000 },
  { nombre: "Inyector PoE 24V", categoria: "Adaptadores y fuentes", codigo: "POE-24", stock: 12, stockMinimo: 4, unidad: "UNIDAD" as const, costoUnitario: 22000 },
  { nombre: "Antena direccional 5 GHz 16 dBi", categoria: "Antenas y torres", codigo: "AN-16", stock: 9, stockMinimo: 3, unidad: "UNIDAD" as const, costoUnitario: 95000 },
  { nombre: "Bracket de montaje", categoria: "Antenas y torres", codigo: "BR-MNT", stock: 15, stockMinimo: 5, unidad: "UNIDAD" as const, costoUnitario: 6000 },
  { nombre: "Pinza crimpadora RJ45", categoria: "Herramientas", codigo: "HR-PIN", stock: 2, stockMinimo: 1, unidad: "UNIDAD" as const, costoUnitario: 45000 },
  { nombre: "Tester de red", categoria: "Herramientas", codigo: "HR-TST", stock: 3, stockMinimo: 1, unidad: "UNIDAD" as const, costoUnitario: 25000 },
  { nombre: "Crimpeadora de conector", categoria: "Herramientas", codigo: "HR-CRP", stock: 1, stockMinimo: 1, unidad: "UNIDAD" as const, costoUnitario: 30000 },
  { nombre: "Switch 8 puertos no administrable", categoria: "Equipos de red", codigo: "SW-08", stock: 3, stockMinimo: 2, unidad: "UNIDAD" as const, costoUnitario: 60000 },
  { nombre: "Access point interior", categoria: "Equipos de red", codigo: "AP-INT", stock: 5, stockMinimo: 2, unidad: "UNIDAD" as const, costoUnitario: 78000 },
];

const ZONAS = ["Centro", "La Esperanza", "Villa Nueva", "Las Acacias", "San José", "El Progreso"];

const NOMBRES = [
  "Carlos Ramírez", "María López", "Jorge Alberto Díaz", "Ana Sofía Torres",
  "Luis Fernando Gómez", "Claudia Patricia Hernández", "Andrés Mauricio Silva",
  "Sandra Milena Rodríguez", "Julián Andrés Pérez", "Carolina Valencia",
  "Diego Alejandro Castro", "Paula Andrea Ríos", "Sebastián Guarín",
  "Luz Marina Ospina", "Fernando Zapata", "Gloria Cecilia Naranjo",
  "Héctor Fabio Londoño", "Marta Liliana Roldán", "Óscar Iván Muñoz",
  "Gloria Alexandra Cuéllar",
];

const DIRECCIONES = [
  "Calle 5 # 12-34", "Carrera 8 # 45-20", "Calle 10 # 3-15", "Carrera 12 # 60-44",
  "Diagonal 20 # 5-10", "Calle 15 # 22-08", "Carrera 5 # 30-25", "Circular 3 # 40-12",
];

const MEDIOS_PAGO = ["EFECTIVO", "NEQUI", "DAVIPLATA", "TRANSFERENCIA", "WOMPI"] as const;
const TECNICOS = ["Jorge (Administrador)", "Miguel Ángel (Técnico)", "Camilo (Técnico)"];

const REVISIONES_EJEMPLO = [
  { tipo: "RUTINA" as const, motivo: "Revisión programada trimestral", solucion: "Equipo limpio y señal estable (-58 dBm). Se ajustó canal." },
  { tipo: "CORRECTIVA" as const, motivo: "Cliente sin señal", solucion: "Se cambió el conector RJ45 dañado y se reubicó la antena." },
  { tipo: "RUTINA" as const, motivo: "Mantenimiento preventivo", solucion: "Limpieza de equipo y actualización de firmware." },
  { tipo: "CORRECTIVA" as const, motivo: "Intermitencias en hora pico", solucion: "Se amplió canal y se optimizó la cola de ancho de banda." },
  { tipo: "REACTIVACION" as const, motivo: "Cliente suspendido por falta de pago, reactivado", solucion: "Se regularizó el pago y se levantó la suspensión." },
];

async function main() {
  console.log("→ Sembrando datos iniciales de A2 Tecnología...\n");

  const hoy = new Date();
  const anio = hoy.getFullYear();

  // --- Configuración --------------------------------------------------------
  const config = await prisma.config.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreEmpresa: "A2 Tecnología",
      nit: "901.456.789-1",
      telefono: "310 555 1234",
      direccion: "Calle 10 # 5-20, Centro",
      email: "contacto@a2tecnologia.com",
      montoEmpresa: 40000,
      conceptoEmpresa: "Parte empresa",
      conceptoDueno: "Ganancia del dueño",
      diasGracia: 5,
    },
  });
  console.log(`  ✓ Configuración (parte empresa $${config.montoEmpresa.toLocaleString("es-CO")})`);

  // --- Usuario -------------------------------------------------------------
  const emailAdmin = process.env.SEED_ADMIN_EMAIL || "admin@a2tecnologia.com";
  const existeUsuario = await prisma.usuario.findUnique({ where: { email: emailAdmin } });
  if (!existeUsuario) {
    await prisma.usuario.create({
      data: {
        nombre: "Administrador A2",
        email: emailAdmin,
        passwordHash: await bcrypt.hash("admin123", 10),
      },
    });
    console.log(`  ✓ Usuario admin: ${emailAdmin} / admin123`);
  } else {
    console.log(`  · Usuario ya existía: ${emailAdmin}`);
  }

  // --- Planes --------------------------------------------------------------
  let creados = 0;
  for (const p of PLANES) {
    const n = await prisma.plan.count({ where: { nombre: p.nombre } });
    if (n === 0) {
      await prisma.plan.create({ data: p });
      creados++;
    }
  }
  console.log(`  ✓ Planes: ${PLANES.length} (${creados} nuevos)`);

  // --- Categorías de contabilidad ------------------------------------------
  for (const c of CATEGORIAS_CONTABILIDAD) {
    await prisma.categoriaTransaccion.upsert({
      where: { nombre_tipo: { nombre: c.nombre, tipo: c.tipo } },
      update: { color: c.color },
      create: c,
    });
  }
  console.log(`  ✓ ${CATEGORIAS_CONTABILIDAD.length} categorías de contabilidad`);

  // --- Categorías e items de inventario ------------------------------------
  const catInventario: Record<string, string> = {};
  for (const c of CATEGORIAS_INVENTARIO) {
    const creada = await prisma.categoriaInventario.upsert({
      where: { nombre: c.nombre },
      update: {},
      create: c,
    });
    catInventario[c.nombre] = creada.id;
  }

  for (const it of ITEMS_INVENTARIO) {
    const existente = await prisma.itemInventario.findUnique({ where: { codigo: it.codigo } });
    if (existente) continue;

    const creado = await prisma.itemInventario.create({
      data: {
        nombre: it.nombre,
        codigo: it.codigo,
        categoriaId: catInventario[it.categoria],
        stock: it.stock,
        stockMinimo: it.stockMinimo,
        unidad: it.unidad,
        costoUnitario: it.costoUnitario,
        precioVenta: 0,
      },
    });

    await prisma.movimientoInventario.create({
      data: {
        itemId: creado.id,
        tipo: "ENTRADA",
        origen: "COMPRA",
        cantidad: it.stock,
        delta: it.stock,
        costoUnitario: it.costoUnitario,
        total: Math.round(it.stock * it.costoUnitario),
        stockResultante: it.stock,
        fecha: new Date(),
        motivo: "Inventario inicial",
      },
    });
  }
  console.log(`  ✓ ${ITEMS_INVENTARIO.length} items de inventario`);

  // --- Categoría de ingresos para los pagos automáticos --------------------
  const catIngreso = await prisma.categoriaTransaccion.findFirst({
    where: { nombre: "Ingresos por Internet" },
  });

  // --- Clientes de ejemplo --------------------------------------------------
  const yaHayClientes = await prisma.cliente.count();
  if (yaHayClientes > 0) {
    console.log(`  · Ya existen ${yaHayClientes} clientes, se omite el ejemplo`);
  } else {
    const anioActual = anio;
    let pagosCreados = 0;
    let cartera = 0;

    const planIds = await prisma.plan.findMany();
    const planPorNombre = new Map(planIds.map((p) => [p.nombre, p.id]));

    for (let i = 0; i < NOMBRES.length; i++) {
      const nombre = NOMBRES[i];
      const plan = PLANES[i % PLANES.length];
      const frecuencia: "MENSUAL" | "QUINCENAL" = i % 3 === 0 ? "QUINCENAL" : "MENSUAL";
      const valorCuota =
        frecuencia === "QUINCENAL" ? Math.round(plan.valorMensual / 2) : plan.valorMensual;

      const mesesAtras = Math.floor(Math.random() * 8);
      const fechaInst = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - mesesAtras,
        Math.floor(Math.random() * 27) + 1,
      );
      const fechaInicioPago = new Date(fechaInst.getFullYear(), fechaInst.getMonth(), 1);

      const cliente = await prisma.cliente.create({
        data: {
          nombre,
          documento: String(1000000000 + Math.floor(Math.random() * 899999999)),
          telefono: `3${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
          direccion: DIRECCIONES[i % DIRECCIONES.length],
          zona: ZONAS[i % ZONAS.length],
          barrio: ZONAS[i % ZONAS.length],
          planId: planPorNombre.get(plan.nombre) ?? null,
          frecuencia,
          valorCuota,
          ip: `192.168.${Math.floor(Math.random() * 20) + 50}.${Math.floor(Math.random() * 250) + 2}`,
          mac: Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase(),
          ).join(":"),
          equipoDesc: Math.random() > 0.4 ? "Router WiFi 4GF" : "Router WiFi 6 AX",
          fechaInstalacion: fechaInst,
          fechaActivacion: fechaInst,
          fechaInicioPago,
          estado: "ACTIVO",
        },
      });

      const totalCortes = frecuencia === "MENSUAL" ? 12 : 24;
      const mesInicio = fechaInicioPago.getMonth();
      const diaVence = fechaInicioPago.getDate();

      for (let c = 0; c < totalCortes; c++) {
        const totalMeses = mesInicio + c;
        const mes = totalMeses % 12;
        const anioCorte = anioActual + Math.floor(totalMeses / 12);
        const quincena = frecuencia === "QUINCENAL" ? (c % 2) + 1 : null;

        const fechaInicioCorte = new Date(
          anioCorte, mes, frecuencia === "QUINCENAL" ? (quincena === 1 ? 1 : 16) : 1,
        );
        if (fechaInicioCorte > hoy) break;

        const codigo =
          frecuencia === "QUINCENAL"
            ? `${anioCorte}-${String(mes + 1).padStart(2, "0")}-Q${quincena}`
            : `${anioCorte}-${String(mes + 1).padStart(2, "0")}`;

        const ultimoDia =
          frecuencia === "QUINCENAL"
            ? quincena === 1
              ? 15
              : new Date(anioCorte, mes + 1, 0).getDate()
            : new Date(anioCorte, mes + 1, 0).getDate();
        const fechaVence = new Date(anioCorte, mes, Math.min(diaVence, ultimoDia));

        const pagado = Math.random() < 0.78;
        const esFuturo = fechaVence > hoy;

        if (!pagado) {
          const estado = fechaVence < hoy ? "ATRASADO" : "PENDIENTE";
          cartera += valorCuota;
          await prisma.periodo.create({
            data: {
              clienteId: cliente.id,
              codigo,
              numero: frecuencia === "QUINCENAL" ? c + 1 : mes + 1,
              anio: anioCorte,
              quincena,
              fechaInicio: fechaInicioCorte,
              fechaVencimiento: fechaVence,
              monto: valorCuota,
              pagado: 0,
              saldo: valorCuota,
              estado: estado as "ATRASADO" | "PENDIENTE",
            },
          });
          continue;
        }

        // Corte pagado: creamos periodo, pago, aplicación y transacción.
        const montoEmpresa = Math.min(config.montoEmpresa, valorCuota);
        const montoDueno = valorCuota - montoEmpresa;

        let fechaPago = new Date(fechaVence);
        fechaPago.setDate(fechaPago.getDate() + Math.floor(Math.random() * 5) - 2);
        if (fechaPago > hoy) fechaPago = new Date(hoy);
        if (esFuturo) continue;

        const periodo = await prisma.periodo.create({
          data: {
            clienteId: cliente.id,
            codigo,
            numero: frecuencia === "QUINCENAL" ? c + 1 : mes + 1,
            anio: anioCorte,
            quincena,
            fechaInicio: fechaInicioCorte,
            fechaVencimiento: fechaVence,
            monto: valorCuota,
            pagado: valorCuota,
            saldo: 0,
            estado: "PAGADO",
            fechaPago,
          },
        });

        const pago = await prisma.pago.create({
          data: {
            clienteId: cliente.id,
            fecha: fechaPago,
            monto: valorCuota,
            metodo: MEDIOS_PAGO[Math.floor(Math.random() * MEDIOS_PAGO.length)],
            referencia: `REF${Math.floor(Math.random() * 900000) + 100000}`,
            concepto: frecuencia === "QUINCENAL" ? `Pago quincena ${codigo}` : `Pago mes ${codigo}`,
            montoEmpresa,
            montoDueno,
            numeroRecibo: ++pagosCreados,
          },
        });

        await prisma.aplicacionPago.create({
          data: { pagoId: pago.id, periodoId: periodo.id, monto: valorCuota },
        });

        if (catIngreso) {
          await prisma.transaccion.create({
            data: {
              fecha: fechaPago,
              tipo: "INGRESO",
              categoriaId: catIngreso.id,
              concepto: `${nombre} - ${frecuencia === "QUINCENAL" ? "quincena" : "mes"} ${codigo}`,
              monto: valorCuota,
              clienteId: cliente.id,
              pagoId: pago.id,
              montoEmpresa,
              montoDueno,
              metodo: "Automático",
              automatica: true,
            },
          });
        }
      }
    }

    console.log(`  ✓ ${NOMBRES.length} clientes con historial de pagos`);
    console.log(`  ✓ ${pagosCreados} pagos registrados`);
    console.log(`  ✓ Cartera pendiente: $${cartera.toLocaleString("es-CO")}`);
  }

  // --- Instalaciones de ejemplo --------------------------------------------
  if ((await prisma.instalacion.count()) === 0) {
    const clientes = await prisma.cliente.findMany({ take: 12, orderBy: { createdAt: "asc" } });
    for (const c of clientes) {
      const fecha = c.fechaInstalacion ?? new Date();
      await prisma.instalacion.create({
        data: {
          clienteId: c.id,
          fecha,
          fechaCompletada: fecha,
          tipo: "NUEVA",
          estado: "COMPLETADA",
          zona: c.zona,
          direccion: c.direccion,
          telefono: c.telefono,
          valorInstalacion: 50000,
          manoObra: 25000,
          routerDesc: c.equipoDesc,
          mac: c.mac,
          ip: c.ip,
          longitudCable: Math.round((Math.random() * 60 + 15) * 10) / 10,
          observacion: "Instalación completada y cliente capacitado en el uso del equipo.",
          recibidoPor: c.nombre,
        },
      });
    }
    console.log(`  ✓ ${clientes.length} instalaciones`);
  }

  // --- Revisiones de ejemplo -----------------------------------------------
  if ((await prisma.revision.count()) === 0) {
    const clientes = await prisma.cliente.findMany({ take: 8, orderBy: { createdAt: "asc" } });
    for (let i = 0; i < clientes.length; i++) {
      const c = clientes[i];
      const r = REVISIONES_EJEMPLO[i % REVISIONES_EJEMPLO.length];
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      await prisma.revision.create({
        data: {
          clienteId: c.id,
          fecha,
          tipo: r.tipo,
          estado: "COMPLETADA",
          motivo: r.motivo,
          diagnostico: r.motivo,
          solucion: r.solucion,
          duracionMin: Math.floor(Math.random() * 90) + 20,
          senalDbm: -Math.round((Math.random() * 20 + 50) * 10) / 10,
          valorCobrado: r.tipo === "CORRECTIVA" ? 30000 : 0,
          proximaRevision: new Date(fecha.getTime() + 90 * 24 * 60 * 60 * 1000),
          tecnico: TECNICOS[i % TECNICOS.length],
        },
      });
    }
    console.log(`  ✓ ${clientes.length} revisiones`);
  }

  // --- Egresos de ejemplo para las gráficas --------------------------------
  if ((await prisma.transaccion.count({ where: { tipo: "EGRESO" } })) === 0) {
    const egresos = [
      { cat: "Internet y operación", monto: 1800000, concepto: "Factura mensual de energía del operador" },
      { cat: "Energía eléctrica", monto: 420000, concepto: "Recibo de energía eléctrica de las bases" },
      { cat: "Mantenimiento de red", monto: 350000, concepto: "Mantenimiento de torres y antenas" },
      { cat: "Transporte y gasolina", monto: 180000, concepto: "Gasolina para visitas técnicas" },
      { cat: "Compra de equipos", monto: 1200000, concepto: "Compra de routers para nuevas instalaciones" },
      { cat: "Publicidad y marketing", monto: 200000, concepto: "Campaña de publicidad en redes sociales" },
    ];

    let creados = 0;
    for (let m = 0; m < 6; m++) {
      for (const e of egresos) {
        const cat = await prisma.categoriaTransaccion.findFirst({
          where: { nombre: e.cat, tipo: "EGRESO" },
        });
        if (!cat) continue;
        const fecha = new Date(anio, hoy.getMonth() - m, Math.floor(Math.random() * 26) + 1);
        if (fecha > hoy) continue;
        await prisma.transaccion.create({
          data: {
            fecha,
            tipo: "EGRESO",
            categoriaId: cat.id,
            concepto: e.concepto,
            monto: e.monto + Math.floor(Math.random() * 100000),
            metodo: ["EFECTIVO", "TRANSFERENCIA"][Math.floor(Math.random() * 2)],
            automatica: false,
          },
        });
        creados++;
      }
    }
    console.log(`  ✓ ${creados} egresos de los últimos meses`);
  }

  console.log("\n✓ Datos iniciales completos.");
  console.log("\n  ═══════════════════════════════════════════");
  console.log("  Entra con:");
  console.log(`    Correo: ${emailAdmin}`);
  console.log("    Clave:  admin123");
  console.log("  ═══════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("✗ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
