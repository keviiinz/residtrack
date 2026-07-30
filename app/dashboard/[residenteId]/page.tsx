import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/dal';
import { db } from '@/db';
import { usuarios, proyectos, tareas, notificaciones } from '@/db/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { CrearProyectoForm } from './CrearProyectoForm';
import { GanttChart } from '@/components/GanttChart';
import { sincronizarTareasAtrasadas } from '@/lib/tareas';
import { obtenerComentariosPorTarea } from '@/lib/comentarios';
import { obtenerEvidenciasPorTarea } from '@/lib/evidencias';
import { LogoutButton } from '@/app/LogoutButton';
import { DevGridBackground } from '@/components/DevGridBackground';

export default async function DashboardResidentePage(props: PageProps<'/dashboard/[residenteId]'>) {
  const user = await getUser();

  if (!user || user.rol !== 'admin') {
    redirect('/cronograma');
  }

  const { residenteId } = await props.params;

  const [residente] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      carrera: usuarios.carrera,
      estado: usuarios.estado,
      rol: usuarios.rol,
    })
    .from(usuarios)
    .where(eq(usuarios.id, residenteId));

  if (!residente || residente.rol !== 'residente') {
    notFound();
  }

  const [proyectoActivo] = await db
    .select()
    .from(proyectos)
    .where(and(eq(proyectos.residenteId, residente.id), eq(proyectos.estado, 'activo')));

  if (proyectoActivo) {
    await sincronizarTareasAtrasadas(proyectoActivo.id);
  }

  const listaTareas = proyectoActivo
    ? await db
        .select()
        .from(tareas)
        .where(eq(tareas.proyectoId, proyectoActivo.id))
        .orderBy(asc(tareas.fechaInicioPlan), asc(tareas.orden))
    : [];

  if (listaTareas.length > 0) {
    await db
      .update(notificaciones)
      .set({ leida: true })
      .where(
        and(
          eq(notificaciones.usuarioId, user.id),
          eq(notificaciones.leida, false),
          inArray(
            notificaciones.tareaId,
            listaTareas.map((tarea) => tarea.id)
          )
        )
      );
  }

  const comentariosPorTarea = await obtenerComentariosPorTarea(listaTareas.map((tarea) => tarea.id), true);
  const evidenciasPorTarea = await obtenerEvidenciasPorTarea(listaTareas.map((tarea) => tarea.id));
  const tareasVisibles = listaTareas.filter((tarea) => tarea.estado !== 'cancelada');

  return (
    <div className="dark relative min-h-screen text-zinc-100">
      <DevGridBackground />
      <main className="mx-auto max-w-6xl p-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-blue-400 hover:underline">
            ← Volver a residentes
          </Link>
          <LogoutButton />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
            {residente.nombre.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">{residente.nombre}</h1>
            <p className="text-sm text-zinc-400">
              {residente.email} · {residente.carrera ?? 'Sin carrera'}
            </p>
          </div>
        </div>

        {!proyectoActivo ? (
          <CrearProyectoForm residenteId={residente.id} />
        ) : (
          <>
            <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
              <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">{proyectoActivo.nombre}</h2>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{proyectoActivo.descripcion}</p>
            </div>

            <GanttChart
              tareas={tareasVisibles}
              rol="admin"
              comentariosPorTarea={comentariosPorTarea}
              evidenciasPorTarea={evidenciasPorTarea}
            />
          </>
        )}
      </main>
    </div>
  );
}
