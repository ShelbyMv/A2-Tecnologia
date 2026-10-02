import { NextResponse, type NextRequest } from "next/server";

/**
 * Protección de rutas.
 *
 * La cookie de sesión está firmada con AUTH_SECRET y sólo la puede crear el
 * servidor, así que basta con comprobar que existe. La verificación real
 * (firma) ocurre en `leerSesion()` dentro de cada página protegida.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tieneSesion = Boolean(request.cookies.get("a2_session")?.value);

  // Rutas públicas: login, API de autenticación y archivos estáticos.
  // Cada API de módulo valida la sesión por su cuenta con `leerSesion()`.
  const esPublica =
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname.startsWith("/_next") ||
    pathname.includes(".");

  if (esPublica) return NextResponse.next();

  if (!tieneSesion) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
