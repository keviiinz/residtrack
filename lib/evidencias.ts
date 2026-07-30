import 'server-only';
import { inArray, asc } from 'drizzle-orm';
import { db } from '@/db';
import { evidencias } from '@/db/schema';
import { crearUrlFirmada } from '@/lib/storage';

export async function obtenerEvidenciasPorTarea(tareaIds: number[]) {
  if (tareaIds.length === 0) return {};

  const filas = await db
    .select()
    .from(evidencias)
    .where(inArray(evidencias.tareaId, tareaIds))
    .orderBy(asc(evidencias.createdAt));

  const conUrl = await Promise.all(
    filas.map(async (fila) => ({
      ...fila,
      url: await crearUrlFirmada(fila.archivoPath),
    }))
  );

  const porTarea: Record<number, typeof conUrl> = {};
  for (const fila of conUrl) {
    const lista = porTarea[fila.tareaId] ?? [];
    lista.push(fila);
    porTarea[fila.tareaId] = lista;
  }
  return porTarea;
}
