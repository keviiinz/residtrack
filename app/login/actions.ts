'use server';

import { db } from '@/db';
import { usuarios } from '@/db/schema';
import { LoginFormSchema, FormState } from '@/lib/definitions';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  const [user] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email));

  if (!user) {
    return { message: 'Correo o contraseña incorrectos.' };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    return { message: 'Correo o contraseña incorrectos.' };
  }

  await createSession(user.id, user.rol);

  if (user.rol === 'admin') {
    redirect('/dashboard');
  } else {
    redirect('/cronograma');
  }
}