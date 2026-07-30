'use server';

import { db } from '@/db';
import { usuarios } from '@/db/schema';
import { SignupFormSchema, FormState } from '@/lib/definitions';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    password: formData.get('password'),
    carrera: formData.get('carrera'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { nombre, email, password, carrera } = validatedFields.data;

  const [existingUser] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email));

  if (existingUser) {
    return { message: 'Ya existe una cuenta con ese correo.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(usuarios)
    .values({
      nombre,
      email,
      passwordHash,
      rol: 'residente',
      carrera,
      estado: 'activo',
    })
    .returning({ id: usuarios.id, rol: usuarios.rol });

  await createSession(newUser.id, newUser.rol);
  redirect('/cronograma');
}