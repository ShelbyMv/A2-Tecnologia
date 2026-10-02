import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "a2_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET no está definido o es muy corto. Agrega uno en tu archivo .env",
    );
  }
  return new TextEncoder().encode(secret);
}

export type Session = {
  id: string;
  nombre: string;
  email: string;
};

/** Crea la cookie de sesión tras un login exitoso. */
export async function crearSesion(usuario: Session): Promise<void> {
  const token = await new SignJWT({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Lee la sesión actual, o null si no hay. */
export async function leerSesion(): Promise<Session | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: String(payload.id),
      nombre: String(payload.nombre),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

/** Cierra la sesión. */
export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Para usar en las páginas del servidor: redirige al login si no hay sesión. */
export async function requiereSesion(): Promise<Session> {
  const sesion = await leerSesion();
  if (!sesion) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  // redirect() nunca retorna; TypeScript no lo sabe.
  return sesion as Session;
}
