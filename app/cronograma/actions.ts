'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, max } from 'drizzle-orm';
import { db } from '@/db';
import { proyectos, tareas, comentarios, historialCambios, evidencias } from '@/db/schema';
import { getUser } from '@/lib/dal';
import { notificarAdmins } from '@/lib/notificaciones';
import { subirArchivo, eliminarArchivo } from '@/lib/storage';
import {
  TareaFormSchema,
  TareaFormState,
  JustificacionFormSchema,
  JustificacionFormState,
  EditarTareaFormSchema,
  EditarTareaFormState,
  EvidenciaFormState,
} from '@/lib/definitions';

const LIMITE_BYTES_EVIDENCIA = 2 * 1024 * 1024;

export async function crearTarea(
  proyectoId: number,
  state: TareaFormState,
  formData: FormData
): Promise<TareaFormState> {
  const user = await getUser();

  if (!user || user.rol !== 'residente') {
    redirect('/dashboard');
  }

  const [proyecto] = await db
    .select({ id: proyectos.id, residenteId: proyectos.residenteId })
    .from(proyectos)
    .where(eq(proyectos.id, proyectoId));

  if (!proyecto || proyecto.residenteId !== user.id) {
    return { message: 'No tienes permiso para modificar este proyecto.' };
  }

  const validatedFields = TareaFormSchema.safeParse({
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    fechaInicioPlan: formData.get('fechaInicioPlan'),
    fechaFinPlan: formData.get('fechaFinPlan'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const [{ maxOrden }] = await db
    .select({ maxOrden: max(tareas.orden) })
    .from(tareas)
    .where(eq(tareas.proyectoId, proyectoId));

  const [nuevaTarea] = await db
    .insert(tareas)
    .values({
      proyectoId,
      ...validatedFields.data,
      orden: (maxOrden ?? 0) + 1,
    })
    .returning({ id: tareas.id, titulo: tareas.titulo });

  await notificarAdmins(nuevaTarea.id, 'cambio_cronograma', `Se agregó la tarea "${nuevaTarea.titulo}".`);

  refresh();
}

export async function justificarAtraso(
  tareaId: number,
  state: JustificacionFormState,
  formData: FormData
): Promise<JustificacionFormState> {
  const user = await getUser();

  if (!user || user.rol !== 'residente') {
    redirect('/dashboard');
  }

  const [tarea] = await db
    .select({
      id: tareas.id,
      titulo: tareas.titulo,
      requiereJustificacion: tareas.requiereJustificacion,
      residenteId: proyectos.residenteId,
    })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(eq(tareas.id, tareaId));

  if (!tarea || tarea.residenteId !== user.id) {
    return { message: 'No tienes permiso para modificar esta tarea.' };
  }

  if (!tarea.requiereJustificacion) {
    return { message: 'Esta tarea no requiere justificación.' };
  }

  const validatedFields = JustificacionFormSchema.safeParse({
    contenido: formData.get('contenido'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  await db.insert(comentarios).values({
    tareaId,
    autorId: user.id,
    tipo: 'justificacion',
    evento: 'atraso',
    contenido: validatedFields.data.contenido,
  });

  await db.update(tareas).set({ requiereJustificacion: false }).where(eq(tareas.id, tareaId));

  await notificarAdmins(tareaId, 'comentario_nuevo', `Se justificó el atraso de la tarea "${tarea.titulo}".`);

  refresh();
}

export async function agregarEvidencia(
  tareaId: number,
  fecha: string,
  state: EvidenciaFormState,
  formData: FormData
): Promise<EvidenciaFormState> {
  const user = await getUser();

  if (!user || user.rol !== 'residente') {
    redirect('/dashboard');
  }

  const [tarea] = await db
    .select({
      id: tareas.id,
      fechaInicioPlan: tareas.fechaInicioPlan,
      fechaFinPlan: tareas.fechaFinPlan,
      residenteId: proyectos.residenteId,
    })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(eq(tareas.id, tareaId));

  if (!tarea || tarea.residenteId !== user.id) {
    return { message: 'No tienes permiso para modificar esta tarea.' };
  }

  if (fecha < tarea.fechaInicioPlan || fecha > tarea.fechaFinPlan) {
    return { message: 'Esa fecha no pertenece al rango de esta tarea.' };
  }

  const titulo = formData.get('titulo')?.toString().trim() ?? '';
  if (titulo.length < 2) {
    return { errors: { titulo: ['El título es requerido.'] } };
  }

  const descripcion = formData.get('descripcion')?.toString().trim() || null;
  const archivo = formData.get('archivo');

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { message: 'Selecciona un archivo (imagen o PDF).' };
  }

  const esImagen = archivo.type.startsWith('image/');
  const esPdf = archivo.type === 'application/pdf';

  if (!esImagen && !esPdf) {
    return { message: 'Solo se aceptan imágenes o archivos PDF.' };
  }

  if (archivo.size > LIMITE_BYTES_EVIDENCIA) {
    return { message: 'El archivo no debe pesar más de 2MB.' };
  }

  const extension = esPdf ? 'pdf' : archivo.type.split('/')[1] || 'jpg';
  const path = `${tareaId}/${fecha}/${crypto.randomUUID()}.${extension}`;

  try {
    await subirArchivo(path, archivo);
  } catch {
    return { message: 'No se pudo subir el archivo. Intenta de nuevo.' };
  }

  await db.insert(evidencias).values({
    tareaId,
    fecha,
    titulo,
    descripcion,
    archivoPath: path,
    archivoTipo: esPdf ? 'pdf' : 'imagen',
    autorId: user.id,
  });

  refresh();
}

export async function restaurarTarea(
  tareaId: number,
  state: TareaFormState,
  formData: FormData
): Promise<TareaFormState> {
  const user = await getUser();

  if (!user || user.rol !== 'residente') {
    redirect('/dashboard');
  }

  const [tareaActual] = await db
    .select({
      id: tareas.id,
      fechaInicioPlan: tareas.fechaInicioPlan,
      fechaFinPlan: tareas.fechaFinPlan,
      estado: tareas.estado,
      residenteId: proyectos.residenteId,
    })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(eq(tareas.id, tareaId));

  if (!tareaActual || tareaActual.residenteId !== user.id) {
    return { message: 'No tienes permiso para modificar esta tarea.' };
  }

  if (tareaActual.estado !== 'cancelada') {
    return { message: 'Esta tarea ya no está cancelada.' };
  }

  const validatedFields = TareaFormSchema.safeParse({
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    fechaInicioPlan: formData.get('fechaInicioPlan'),
    fechaFinPlan: formData.get('fechaFinPlan'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { titulo, descripcion, fechaInicioPlan, fechaFinPlan } = validatedFields.data;

  const cambios: { campo: string; anterior: string; nuevo: string }[] = [
    { campo: 'estado', anterior: 'cancelada', nuevo: 'pendiente' },
  ];
  if (fechaInicioPlan !== tareaActual.fechaInicioPlan) {
    cambios.push({ campo: 'fechaInicioPlan', anterior: tareaActual.fechaInicioPlan, nuevo: fechaInicioPlan });
  }
  if (fechaFinPlan !== tareaActual.fechaFinPlan) {
    cambios.push({ campo: 'fechaFinPlan', anterior: tareaActual.fechaFinPlan, nuevo: fechaFinPlan });
  }

  for (const cambio of cambios) {
    await db.insert(historialCambios).values({
      tareaId,
      usuarioId: user.id,
      campoModificado: cambio.campo,
      valorAnterior: cambio.anterior,
      valorNuevo: cambio.nuevo,
    });
  }

  await db
    .update(tareas)
    .set({
      titulo,
      descripcion,
      fechaInicioPlan,
      fechaFinPlan,
      estado: 'pendiente',
      updatedAt: new Date(),
    })
    .where(eq(tareas.id, tareaId));

  await notificarAdmins(tareaId, 'cambio_cronograma', `Se restauró la tarea "${titulo}" al cronograma.`);

  refresh();
}

export async function editarEvidencia(
  evidenciaId: number,
  state: EvidenciaFormState,
  formData: FormData
): Promise<EvidenciaFormState> {
  const user = await getUser();

  if (!user || user.rol !== 'residente') {
    redirect('/dashboard');
  }

  const [evidenciaActual] = await db
    .select({
      id: evidencias.id,
      tareaId: evidencias.tareaId,
      fecha: evidencias.fecha,
      archivoPath: evidencias.archivoPath,
      residenteId: proyectos.residenteId,
    })
    .from(evidencias)
    .innerJoin(tareas, eq(evidencias.tareaId, tareas.id))
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(eq(evidencias.id, evidenciaId));

  if (!evidenciaActual || evidenciaActual.residenteId !== user.id) {
    return { message: 'No tienes permiso para modificar esta evidencia.' };
  }

  const titulo = formData.get('titulo')?.toString().trim() ?? '';
  if (titulo.length < 2) {
    return { errors: { titulo: ['El título es requerido.'] } };
  }

  const descripcion = formData.get('descripcion')?.toString().trim() || null;
  const archivo = formData.get('archivo');

  const cambios: { archivoPath?: string; archivoTipo?: 'imagen' | 'pdf' } = {};

  if (archivo instanceof File && archivo.size > 0) {
    const esImagen = archivo.type.startsWith('image/');
    const esPdf = archivo.type === 'application/pdf';

    if (!esImagen && !esPdf) {
      return { message: 'Solo se aceptan imágenes o archivos PDF.' };
    }

    if (archivo.size > LIMITE_BYTES_EVIDENCIA) {
      return { message: 'El archivo no debe pesar más de 2MB.' };
    }

    const extension = esPdf ? 'pdf' : archivo.type.split('/')[1] || 'jpg';
    const path = `${evidenciaActual.tareaId}/${evidenciaActual.fecha}/${crypto.randomUUID()}.${extension}`;

    try {
      await subirArchivo(path, archivo);
    } catch {
      return { message: 'No se pudo subir el archivo. Intenta de nuevo.' };
    }

    try {
      await eliminarArchivo(evidenciaActual.archivoPath);
    } catch {
      // El archivo anterior queda huérfano si esto falla; no bloquea la edición.
    }

    cambios.archivoPath = path;
    cambios.archivoTipo = esPdf ? 'pdf' : 'imagen';
  }

  await db
    .update(evidencias)
    .set({ titulo, descripcion, ...cambios })
    .where(eq(evidencias.id, evidenciaId));

  refresh();
}

export async function editarTarea(
  tareaId: number,
  state: EditarTareaFormState,
  formData: FormData
): Promise<EditarTareaFormState> {
  const user = await getUser();

  if (!user || user.rol !== 'residente') {
    redirect('/dashboard');
  }

  const [tareaActual] = await db
    .select({
      id: tareas.id,
      titulo: tareas.titulo,
      fechaInicioPlan: tareas.fechaInicioPlan,
      fechaFinPlan: tareas.fechaFinPlan,
      fechaInicioReal: tareas.fechaInicioReal,
      fechaFinReal: tareas.fechaFinReal,
      estado: tareas.estado,
      residenteId: proyectos.residenteId,
    })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(eq(tareas.id, tareaId));

  if (!tareaActual || tareaActual.residenteId !== user.id) {
    return { message: 'No tienes permiso para modificar esta tarea.' };
  }

  const validatedFields = EditarTareaFormSchema.safeParse({
    fechaInicioPlan: formData.get('fechaInicioPlan'),
    fechaFinPlan: formData.get('fechaFinPlan'),
    estado: formData.get('estado'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { fechaInicioPlan, fechaFinPlan, estado } = validatedFields.data;
  const justificacion = formData.get('justificacion')?.toString().trim() ?? '';
  const hoy = new Date().toISOString().slice(0, 10);

  const esReprogramacion =
    fechaInicioPlan !== tareaActual.fechaInicioPlan || fechaFinPlan !== tareaActual.fechaFinPlan;
  const esAdelanto =
    estado === 'completada' && tareaActual.estado !== 'completada' && hoy < tareaActual.fechaFinPlan;
  const esCancelacion = estado === 'cancelada' && tareaActual.estado !== 'cancelada';

  if ((esReprogramacion || esAdelanto || esCancelacion) && justificacion.length < 5) {
    return { message: 'Debes justificar este cambio antes de guardar.' };
  }

  const cambios: { campo: string; anterior: string; nuevo: string }[] = [];
  if (fechaInicioPlan !== tareaActual.fechaInicioPlan) {
    cambios.push({ campo: 'fechaInicioPlan', anterior: tareaActual.fechaInicioPlan, nuevo: fechaInicioPlan });
  }
  if (fechaFinPlan !== tareaActual.fechaFinPlan) {
    cambios.push({ campo: 'fechaFinPlan', anterior: tareaActual.fechaFinPlan, nuevo: fechaFinPlan });
  }
  if (estado !== tareaActual.estado) {
    cambios.push({ campo: 'estado', anterior: tareaActual.estado, nuevo: estado });
  }

  for (const cambio of cambios) {
    await db.insert(historialCambios).values({
      tareaId,
      usuarioId: user.id,
      campoModificado: cambio.campo,
      valorAnterior: cambio.anterior,
      valorNuevo: cambio.nuevo,
    });
  }

  await db
    .update(tareas)
    .set({
      fechaInicioPlan,
      fechaFinPlan,
      estado,
      updatedAt: new Date(),
      ...(estado === 'en_curso' && !tareaActual.fechaInicioReal ? { fechaInicioReal: hoy } : {}),
      ...(estado === 'completada' && !tareaActual.fechaFinReal ? { fechaFinReal: hoy } : {}),
    })
    .where(eq(tareas.id, tareaId));

  if (esReprogramacion || esAdelanto || esCancelacion) {
    const visibleParaAdmin = esCancelacion ? formData.get('visibleParaAdmin') === 'true' : true;

    await db.insert(comentarios).values({
      tareaId,
      autorId: user.id,
      tipo: 'justificacion',
      evento: esReprogramacion ? 'reprogramacion' : esAdelanto ? 'adelanto' : 'cancelacion',
      contenido: justificacion,
      visibleParaAdmin,
    });

    if (esReprogramacion) {
      await notificarAdmins(tareaId, 'cambio_cronograma', `Se reprogramó la tarea "${tareaActual.titulo}".`);
    } else if (esAdelanto) {
      await notificarAdmins(tareaId, 'tarea_adelantada', `Se adelantó la tarea "${tareaActual.titulo}".`);
    } else {
      await notificarAdmins(tareaId, 'tarea_cancelada', `Se canceló la tarea "${tareaActual.titulo}".`);
    }
  }

  refresh();
}
