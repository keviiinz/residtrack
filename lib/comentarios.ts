import 'server-only';
import { inArray, asc, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { comentarios, usuarios } from '@/db/schema';

export async function obtenerComentariosPorTarea(tareaIds: number[], paraAdmin = false) {
  if (tareaIds.length === 0) return {};

  const condicion = paraAdmin
    ? and(inArray(comentarios.tareaId, tareaIds), eq(comentarios.visibleParaAdmin, true))
    : inArray(comentarios.tareaId, tareaIds);

  const filas = await db
    .select({
      id: comentarios.id,
      tareaId: comentarios.tareaId,
      tipo: comentarios.tipo,
      evento: comentarios.evento,
      contenido: comentarios.contenido,
      visibleParaAdmin: comentarios.visibleParaAdmin,
      comentarioPadreId: comentarios.comentarioPadreId,
      createdAt: comentarios.createdAt,
      autorNombre: usuarios.nombre,
    })
    .from(comentarios)
    .innerJoin(usuarios, eq(comentarios.autorId, usuarios.id))
    .where(condicion)
    .orderBy(asc(comentarios.createdAt));

  const porTarea: Record<number, typeof filas> = {};
  for (const fila of filas) {
    const lista = porTarea[fila.tareaId] ?? [];
    lista.push(fila);
    porTarea[fila.tareaId] = lista;
  }
  return porTarea;
}
