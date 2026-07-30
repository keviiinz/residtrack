import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/dal';
import { db } from '@/db';
import { usuarios, notificaciones, tareas, proyectos } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NotificacionesBell } from './NotificacionesBell';
import { LogoutButton } from '@/app/LogoutButton';
import { DevGridBackground } from '@/components/DevGridBackground';

const ESTILO_ESTADO: Record<string, string> = {
  activo: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  finalizado: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  baja: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export default async function DashboardPage() {
  const user = await getUser();

  if (!user || user.rol !== 'admin') {
    redirect('/cronograma');
  }

  const residentes = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      carrera: usuarios.carrera,
      estado: usuarios.estado,
    })
    .from(usuarios)
    .where(eq(usuarios.rol, 'residente'));

  const notificacionesAdmin = await db
    .select({
      id: notificaciones.id,
      tipo: notificaciones.tipo,
      mensaje: notificaciones.mensaje,
      leida: notificaciones.leida,
      createdAt: notificaciones.createdAt,
      residenteId: proyectos.residenteId,
    })
    .from(notificaciones)
    .innerJoin(tareas, eq(notificaciones.tareaId, tareas.id))
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(eq(notificaciones.usuarioId, user.id))
    .orderBy(desc(notificaciones.createdAt));

  const notificacionesPorResidente = new Map<string, typeof notificacionesAdmin>();
  for (const notificacion of notificacionesAdmin) {
    const lista = notificacionesPorResidente.get(notificacion.residenteId) ?? [];
    lista.push(notificacion);
    notificacionesPorResidente.set(notificacion.residenteId, lista);
  }

  return (
    <div className="dark relative min-h-screen text-zinc-100">
      <DevGridBackground />
      <main className="mx-auto max-w-4xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">Residentes</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {residentes.length} {residentes.length === 1 ? 'residente registrado' : 'residentes registrados'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/historial"
              className="flex items-center gap-1.5 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
              title="Historial de cambios"
            >
              🕓 Historial
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Carrera</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {residentes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500">
                    Todavía no hay residentes registrados.
                  </td>
                </tr>
              )}
              {residentes.map((residente) => {
                const notificacionesResidente = notificacionesPorResidente.get(residente.id) ?? [];

                return (
                  <tr
                    key={residente.id}
                    className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          {residente.nombre.slice(0, 2).toUpperCase()}
                        </span>
                        <Link
                          href={`/dashboard/${residente.id}`}
                          className="font-medium text-zinc-900 hover:text-blue-600 hover:underline dark:text-zinc-100 dark:hover:text-blue-400"
                        >
                          {residente.nombre}
                        </Link>
                        <NotificacionesBell residenteId={residente.id} notificaciones={notificacionesResidente} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{residente.email}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{residente.carrera ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTILO_ESTADO[residente.estado] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}
                      >
                        {residente.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
