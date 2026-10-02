import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { crearSesion } from "@/lib/sesion";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Ingresa tu correo y contraseña" },
        { status: 400 },
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Mensaje genérico: no revela si el correo existe o no.
    const credencialesIncorrectas = NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 },
    );

    if (!usuario || !usuario.activo) return credencialesIncorrectas;

    const valido = await bcrypt.compare(password, usuario.passwordHash);
    if (!valido) return credencialesIncorrectas;

    await crearSesion({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
