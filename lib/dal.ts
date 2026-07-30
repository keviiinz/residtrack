import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/session';
import { db } from '@/db';
import { usuarios } from '@/db/schema';

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect('/login');
  }

  return { isAuth: true, userId: session.userId, rol: session.rol };
});

export const getUser = cache(async () => {
  const session = await verifySession();

  const [user] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      rol: usuarios.rol,
      carrera: usuarios.carrera,
      fechaInicioResidencia: usuarios.fechaInicioResidencia,
      fechaFinResidencia: usuarios.fechaFinResidencia,
      estado: usuarios.estado,
      createdAt: usuarios.createdAt,
    })
    .from(usuarios)
    .where(eq(usuarios.id, session.userId));

  return user ?? null;
});