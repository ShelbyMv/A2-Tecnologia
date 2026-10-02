/**
 * Base de datos local de desarrollo.
 *
 * Usa los binarios de PostgreSQL 16 que trae @embedded-postgres/linux-x64,
 * así no hace falta instalar nada en el sistema ni tener permisos de root.
 *
 *   npm run db:local start    → levanta la base
 *   npm run db:local stop     → la detiene
 *   npm run db:local status   → muestra el estado
 *   npm run db:local reset    → borra todo y vuelve a crear (CUIDADO)
 *
 * En producción (Vercel + Neon) esto NO se usa: apuntas DATABASE_URL a Neon.
 */
import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const BIN = path.join(
  process.cwd(),
  "node_modules/@embedded-postgres/linux-x64/native/bin",
);
const DATA = path.join(process.cwd(), ".pgdata");
const LOG = path.join(DATA, "postgres.log");
const PORT = process.env.PG_PORT || "5433";
const DB_NAME = "a2tecnologia";
const DB_USER = "postgres";
const DB_PASS = "postgres";

const INITDB = path.join(BIN, "initdb");
const PG_CTL = path.join(BIN, "pg_ctl");
const PSQL = path.join(BIN, "psql");

function run(cmd, args = []) {
  execFileSync(cmd, args, { stdio: "inherit", env: process.env });
}

function runQuiet(cmd, args = []) {
  return execSync(
    `"${cmd}" ${args.map((a) => `"${a}"`).join(" ")} 2>/dev/null`,
    { encoding: "utf8" },
  ).trim();
}

function isRunning() {
  if (!existsSync(path.join(DATA, "PG_VERSION"))) return false;
  try {
    const out = runQuiet(PG_CTL, ["-D", DATA, "status"]);
    return out.includes("server is running");
  } catch {
    return false;
  }
}

function initCluster() {
  if (existsSync(path.join(DATA, "PG_VERSION"))) return;
  console.log("→ Creando cluster de PostgreSQL en .pgdata ...");
  mkdirSync(DATA, { recursive: true });
  run(INITDB, [
    "-D", DATA,
    "-U", DB_USER,
    "--auth=trust",
    "--auth-local=trust",
    "--auth-host=trust",
    "-E", "UTF8",
    "--locale=C",
  ]);
}

function start() {
  if (isRunning()) {
    console.log("✓ La base de datos local ya está corriendo.");
    return;
  }
  initCluster();

  console.log(`→ Levantando PostgreSQL en el puerto ${PORT} ...`);

  // El puerto no se puede pasar a pg_ctl start; va en el archivo de config.
  const confPath = path.join(DATA, "postgresql.auto.conf");
  const confLine = (line) => {
    if (existsSync(confPath)) {
      const actual = readFileSync(confPath, "utf8");
      if (actual.includes(line.split("=")[0].trim())) return;
    }
    execSync(`echo '${line}' >> "${confPath}"`, { stdio: "inherit" });
  };
  confLine(`port = ${PORT}`);
  // Sólo escucha en local, para no exponer la base en la red.
  confLine(`listen_addresses = 'localhost'`);

  run(PG_CTL, ["-D", DATA, "-l", LOG, "-w", "start"]);

  try {
    runQuiet(PSQL, [
      "-h", "localhost", "-p", PORT, "-U", DB_USER, "-d", "postgres",
      "-c", `CREATE DATABASE ${DB_NAME}`,
    ]);
    console.log(`✓ Base de datos "${DB_NAME}" creada.`);
  } catch {
    // Ya existía, está bien.
  }

  console.log(`\n  Conexión para usar en .env:`);
  console.log(
    `  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${PORT}/${DB_NAME}?schema=public"\n`,
  );
}

function stop() {
  if (!isRunning()) {
    console.log("· La base de datos local no está corriendo.");
    return;
  }
  console.log("→ Deteniendo PostgreSQL ...");
  run(PG_CTL, ["-D", DATA, "-m", "fast", "-w", "stop"]);
}

function status() {
  const corriendo = isRunning();
  console.log(corriendo ? "✓ Corriendo" : "· Detenida");
  if (corriendo) {
    console.log(`  Puerto: ${PORT}`);
    console.log(`  Base:   ${DB_NAME}`);
    console.log(`  Datos:  ${DATA}`);
  }
}

function reset() {
  if (isRunning()) stop();
  console.log("→ Borrando los datos locales ...");
  execSync(`rm -rf "${DATA}"`, { stdio: "inherit" });
  start();
  console.log("\nBase recreada y vacia. Ejecuta 'npm run db:push && npm run db:seed'.");
}

const comando = process.argv[2] || "start";

switch (comando) {
  case "start": start(); break;
  case "stop": stop(); break;
  case "status": status(); break;
  case "reset": reset(); break;
  default:
    console.log("Uso: npm run db:local [start|stop|status|reset]");
    process.exit(1);
}
