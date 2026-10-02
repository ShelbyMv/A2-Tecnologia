# A2 Tecnología — Sistema de Gestión

Sistema web para la gestión de una empresa de servicios de Internet/Wi-Fi:
clientes, pagos con matriz de estados, instalaciones, revisiones, desmontes,
contabilidad con gráficas e inventario.

Moneda: pesos colombianos (COP). Idioma: español.

---

## Módulos

| Módulo | Qué hace |
|---|---|
| **Panel** | KPIs: clientes activos, ingresos del mes, cartera, inventario |
| **Clientes** | Registro completo: datos, plan, frecuencia (mensual/quincenal), cuota, IP, MAC, equipo, fechas y estado |
| **Pagos** | Matriz de pagos (clientes × meses con colores: verde pagado, amarillo pendiente, rojo atrasado, azul abono), registro de pagos que pueden cubrir varios cortes, recibos imprimibles en PDF |
| **Instalaciones** | Cliente, fecha, tipo (nueva/reinstalación/traslado), estado, valor, mano de obra, router/MAC/IP |
| **Revisiones** | Cliente, fecha, tipo, diagnóstico, solución, señal, velocidades medidas, próxima revisión |
| **Desmontes** | Retiro de equipos con estado individual, saldo a favor del cliente; al completar, el cliente pasa a DESMONTADO |
| **Contabilidad** | Ingresos (automáticos desde pagos) y egresos por categoría, gráficas de barras y circular, ganancia neta, cartera por antigüedad |
| **Inventario** | Items con stock, stock mínimo (alertas), costo, historial completo de movimientos con origen |
| **Importar Excel** | Carga tu .xlsx de clientes con detección de columnas y vista previa |
| **Configuración** | Datos de la empresa, monto fijo para la empresa (reparto de ingresos), días de tolerancia de mora |

### El reparto de ingresos

En **Configuración** defines el monto fijo que va a la empresa (por defecto
$40.000). De cada pago registrado, esa parte va a la empresa y el resto es la
ganancia del dueño. Contabilidad muestra ambos montos por separado, y cada
recibo PDF incluye el desglose marcado como "uso interno".

---

## Tecnología

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + componentes propios estilo shadcn/ui
- **Prisma 6** + **PostgreSQL** (Neon en producción)
- **Recharts** (gráficas), **jose + bcryptjs** (sesión), **SheetJS** (Excel)
- Despliegue: **Vercel** (app) + **Neon** (base de datos) — plan gratuito

---

## Desarrollo local

La base de datos local usa binarios de PostgreSQL incluidos en el proyecto
(no hace falta instalar nada en el sistema ni tener permisos de root).

```bash
npm install          # instalar dependencias
npm run setup        # levanta Postgres local + crea tablas + datos de ejemplo
npm run dev          # arranca la app en http://localhost:3000
```

Entra con:

```
Correo: admin@a2tecnologia.com
Clave:  admin123
```

Otros comandos útiles:

```bash
npm run db:local stop      # detener la base local
npm run db:local status    # estado de la base
npm run db:local reset     # borrar datos y recrear (CUIDADO)
npm run db:push            # aplicar cambios del esquema
npm run db:seed            # datos de ejemplo
npm run db:studio          # explorador visual de la base de datos
npm run typecheck          # verificación de tipos
npm run build              # build de producción
```

---

## Despliegue en la nube (Vercel + Neon, gratis)

### 1. Crear la base de datos en Neon

1. Entra a [neon.tech](https://neon.tech) y crea una cuenta gratis (sin tarjeta).
2. Crea un proyecto (ej: `a2-tecnologia`).
3. Copia la **connection string** (empieza con `postgresql://...` e incluye `?sslmode=require`).

### 2. Crear las tablas y el usuario administrador

Desde tu PC, apuntando a Neon:

```bash
# en .env pega la URL de Neon
DATABASE_URL="postgresql://usuario:clave@ep-xxxx.aws.neon.tech/neondb?sslmode=require"

npm run db:push       # crea las tablas en Neon
npm run db:seed       # crea planes, categorías y el usuario admin
```

> El seed crea el usuario `admin@a2tecnologia.com` con clave `admin123`.
> **Cámbiala después** desde la base de datos o pidiendo un cambio de clave.

### 3. Subir la app a Vercel

```bash
npm i -g vercel
vercel               # la primera vez: sigue el asistente
vercel --prod        # despliegue a producción
```

En el panel de Vercel (Settings → Environment Variables) agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La connection string de Neon |
| `AUTH_SECRET` | Un secreto aleatorio: `openssl rand -base64 32` |

### 4. Datos reales

Entra al sistema con el usuario admin y usa el módulo **Importar Excel**
para cargar tus clientes desde tu archivo actual. Luego registra los pagos
desde la matriz.

---

## Notas importantes

- **Vercel Hobby** es gratuito pero sus términos lo limitan a uso no comercial.
  Si Vercel lo detecta como negocio, migrar a Pro ($20/mes) es un clic.
- **Neon Free** escala a cero tras 5 minutos de inactividad: la primera
  consulta después de una pausa tarda ~1 segundo más. Para un solo usuario es
  imperceptible en el uso normal.
- **La base de datos local** (`.pgdata/`) no se sube a git y no se usa en
  producción.
- El proyecto no está inicializado como repositorio git. Para versionarlo:
  `git init && git add . && git commit -m "Sistema inicial A2 Tecnología"`.

---

## Estructura del proyecto

```
prisma/schema.prisma      Esquema completo de la base de datos
prisma/seed.ts            Datos iniciales (planes, categorías, admin, ejemplos)
scripts/db-local.mjs      Postgres local sin root (desarrollo)
src/app/(auth)/login      Inicio de sesión
src/app/(app)/            Módulos: dashboard, clientes, pagos, instalaciones,
                          revisiones, desmontes, contabilidad, inventario,
                          planes, configuracion, importar
src/app/(recibo)/         Recibo imprimible en PDF
src/app/api/              APIs REST de cada módulo
src/components/           UI reutilizable (card, dialog, kpi, matriz de pagos...)
src/lib/                  Utilidades: fechas, formato COP, sesión, validaciones
```
