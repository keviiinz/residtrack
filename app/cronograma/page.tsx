import { redirect } from 'next/navigation';
import { getUser } from '@/lib/dal';
import { db } from '@/db';
import { proyectos, tareas } from '@/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { CrearTareaForm } from './CrearTareaForm';
import { GanttChart } from '@/components/GanttChart';
import { TareasCanceladasBoton } from './TareasCanceladasBoton';
import { sincronizarTareasAtrasadas } from '@/lib/tareas';
import { obtenerComentariosPorTarea } from '@/lib/comentarios';
import { obtenerEvidenciasPorTarea } from '@/lib/evidencias';
import { LogoutButton } from '@/app/LogoutButton';
import { DevGridBackground } from '@/components/DevGridBackground';

export default async function CronogramaPage() {
  const user = await getUser();

  if (!user || user.rol !== 'residente') {
    redirect('/dashboard');
  }

  const [proyectoActivo] = await db
    .select()
    .from(proyectos)
    .where(and(eq(proyectos.residenteId, user.id), eq(proyectos.estado, 'activo')));

  if (!proyectoActivo) {
    return (
      <div className="dark relative min-h-screen text-zinc-100">
        <DevGridBackground />
        <main className="mx-auto max-w-3xl p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-zinc-50">Hola, {user.nombre}</h1>
            <LogoutButton />
          </div>
          <p className="mt-4 text-zinc-400">
            Todavía no tienes un proyecto asignado. Cuando un administrador te asigne uno,
            aparecerá aquí.
          </p>
        </main>
      </div>
    );
  }

  await sincronizarTareasAtrasadas(proyectoActivo.id);

  const listaTareas = await db
    .select()
    .from(tareas)
    .where(eq(tareas.proyectoId, proyectoActivo.id))
    .orderBy(asc(tareas.fechaInicioPlan), asc(tareas.orden));

  const comentariosPorTarea = await obtenerComentariosPorTarea(listaTareas.map((tarea) => tarea.id));
  const evidenciasPorTarea = await obtenerEvidenciasPorTarea(listaTareas.map((tarea) => tarea.id));

  const tareasCanceladas = listaTareas.filter((tarea) => tarea.estado === 'cancelada');
  const tareasVisibles = listaTareas.filter((tarea) => tarea.estado !== 'cancelada');
  const justificacionesPorTarea: Record<number, { contenido: string; visibleParaAdmin: boolean; createdAt: Date } | undefined> = {};
  for (const tarea of tareasCanceladas) {
    const comentarios = comentariosPorTarea[tarea.id] ?? [];
    const justificacion = [...comentarios].reverse().find((c) => c.evento === 'cancelacion');
    if (justificacion) {
      justificacionesPorTarea[tarea.id] = {
        contenido: justificacion.contenido,
        visibleParaAdmin: justificacion.visibleParaAdmin,
        createdAt: justificacion.createdAt,
      };
    }
  }

  return (
    <div className="dark relative min-h-screen text-zinc-100">
      <DevGridBackground />
      <main className="mx-auto max-w-6xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">{proyectoActivo.nombre}</h1>
            <p className="mt-1 text-zinc-400">{proyectoActivo.descripcion}</p>
          </div>
          <div className="flex items-center gap-2">
            <TareasCanceladasBoton tareas={tareasCanceladas} justificacionesPorTarea={justificacionesPorTarea} />
            <LogoutButton />
          </div>
        </div>

        <GanttChart
          tareas={tareasVisibles}
          rol="residente"
          comentariosPorTarea={comentariosPorTarea}
          evidenciasPorTarea={evidenciasPorTarea}
        />

        <CrearTareaForm proyectoId={proyectoActivo.id} />
      </main>
    </div>
  );
}
