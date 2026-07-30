import 'server-only';
import { and, eq, lt, notInArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { tareas } from '@/db/schema';
import { notificarAdmins } from '@/lib/notificaciones';

export async function sincronizarTareasAtrasadas(proyectoId: number) {
  const tareasRecienAtrasadas = await db
    .update(tareas)
    .set({ estado: 'retrasada', requiereJustificacion: true })
    .where(
      and(
        eq(tareas.proyectoId, proyectoId),
        lt(tareas.fechaFinPlan, sql`CURRENT_DATE`),
        notInArray(tareas.estado, ['completada', 'retrasada', 'cancelada'])
      )
    )
    .returning({ id: tareas.id, titulo: tareas.titulo });

  for (const tarea of tareasRecienAtrasadas) {
    await notificarAdmins(tarea.id, 'tarea_retrasada', `La tarea "${tarea.titulo}" se atrasó.`);
  }
}
