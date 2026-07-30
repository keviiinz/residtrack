'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { proyectos, tareas, notificaciones, comentarios } from '@/db/schema';
import { getUser } from '@/lib/dal';
import { notificarUsuario } from '@/lib/notificaciones';
import { ProyectoFormSchema, ProyectoFormState, NotaFormSchema, NotaFormState } from '@/lib/definitions';

export async function crearProyecto(
  residenteId: string,
  state: ProyectoFormState,
  formData: FormData
): Promise<ProyectoFormState> {
  const user = await getUser();

  if (!user || user.rol !== 'admin') {
    redirect('/cronograma');
  }

  const validatedFields = ProyectoFormSchema.safeParse({
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    fechaInicio: formData.get('fechaInicio'),
    fechaFinEstimada: formData.get('fechaFinEstimada'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const [existente] = await db
    .select({ id: proyectos.id })
    .from(proyectos)
    .where(and(eq(proyectos.residenteId, residenteId), eq(proyectos.estado, 'activo')));

  if (existente) {
    return { message: 'Este residente ya tiene un proyecto activo.' };
  }

  await db.insert(proyectos).values({
    residenteId,
    ...validatedFields.data,
    estado: 'activo',
  });

  refresh();
}

export async function marcarNotificacionesLeidas(residenteId: string) {
  const user = await getUser();

  if (!user || user.rol !== 'admin') {
    redirect('/cronograma');
  }

  const tareasDelResidente = await db
    .select({ id: tareas.id })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(eq(proyectos.residenteId, residenteId));

  if (tareasDelResidente.length === 0) return;

  await db
    .update(notificaciones)
    .set({ leida: true })
    .where(
      and(
        eq(notificaciones.usuarioId, user.id),
        eq(notificaciones.leida, false),
        inArray(
          notificaciones.tareaId,
          tareasDelResidente.map((tarea) => tarea.id)
        )
      )
    );

  refresh();
}

export async function agregarNota(
  tareaId: number,
  state: NotaFormState,
  formData: FormData
): Promise<NotaFormState> {
  const user = await getUser();

  if (!user || user.rol !== 'admin') {
    redirect('/cronograma');
  }

  const [tarea] = await db
    .select({ id: tareas.id, titulo: tareas.titulo, residenteId: proyectos.residenteId })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(eq(tareas.id, tareaId));

  if (!tarea) {
    return { message: 'Esta tarea ya no existe.' };
  }

  const validatedFields = NotaFormSchema.safeParse({
    contenido: formData.get('contenido'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const comentarioPadreIdRaw = formData.get('comentarioPadreId');
  const comentarioPadreId = comentarioPadreIdRaw ? Number(comentarioPadreIdRaw) : null;

  await db.insert(comentarios).values({
    tareaId,
    autorId: user.id,
    tipo: 'feedback',
    contenido: validatedFields.data.contenido,
    comentarioPadreId,
  });

  await notificarUsuario(
    tarea.residenteId,
    tareaId,
    'comentario_nuevo',
    `Un administrador dejó una nota en la tarea "${tarea.titulo}".`
  );

  refresh();
}