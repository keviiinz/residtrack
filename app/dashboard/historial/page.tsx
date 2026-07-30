import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/dal';
import { db } from '@/db';
import { historialCambios, tareas, proyectos, usuarios } from '@/db/schema';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { LogoutButton } from '@/app/LogoutButton';
import { DevGridBackground } from '@/components/DevGridBackground';

const ETIQUETA_CAMPO: Record<string, string> = {
  fechaInicioPlan: 'Fecha de inicio',
  fechaFinPlan: 'Fecha fin',
  estado: 'Estado',
};

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completada: 'Completada',
  retrasada: 'Retrasada',
  cancelada: 'Cancelada',
};

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function formatValor(campo: string, valor: string): string {
  if (campo === 'estado') return ETIQUETA_ESTADO[valor] ?? valor;
  if (FECHA_REGEX.test(valor)) {
    const [anio, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  return valor;
}

export default async function HistorialPage(props: PageProps<'/dashboard/historial'>) {
  const user = await getUser();

  if (!user || user.rol !== 'admin') {
    redirect('/cronograma');
  }

  const params = await props.searchParams;
  const residenteId = typeof params.residenteId === 'string' ? params.residenteId : '';
  const desde = typeof params.desde === 'string' && FECHA_REGEX.test(params.desde) ? params.desde : '';
  const hasta = typeof params.hasta === 'string' && FECHA_REGEX.test(params.hasta) ? params.hasta : '';

  const residentes = await db
    .select({ id: usuarios.id, nombre: usuarios.nombre })
    .from(usuarios)
    .where(eq(usuarios.rol, 'residente'))
    .orderBy(asc(usuarios.nombre));

  const condiciones = [];
  if (residenteId) condiciones.push(eq(proyectos.residenteId, residenteId));
  if (desde) condiciones.push(gte(historialCambios.fechaCambio, new Date(`${desde}T00:00:00`)));
  if (hasta) condiciones.push(lte(historialCambios.fechaCambio, new Date(`${hasta}T23:59:59`)));

  const cambios = await db
    .select({
      id: historialCambios.id,
      campoModificado: historialCambios.campoModificado,
      valorAnterior: historialCambios.valorAnterior,
      valorNuevo: historialCambios.valorNuevo,
      fechaCambio: historialCambios.fechaCambio,
      tareaTitulo: tareas.titulo,
      residenteId: proyectos.residenteId,
      residenteNombre: usuarios.nombre,
    })
    .from(historialCambios)
    .innerJoin(tareas, eq(historialCambios.tareaId, tareas.id))
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .innerJoin(usuarios, eq(historialCambios.usuarioId, usuarios.id))
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(desc(historialCambios.fechaCambio))
    .limit(200);

  const hayFiltros = residenteId !== '' || desde !== '' || hasta !== '';

  return (
    <div className="dark relative min-h-screen text-zinc-100">
      <DevGridBackground />
      <main className="mx-auto max-w-4xl p-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-blue-400 hover:underline">
            ← Volver a residentes
          </Link>
          <LogoutButton />
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold text-zinc-50">Historial de cambios</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {cambios.length} {cambios.length === 1 ? 'cambio registrado' : 'cambios registrados'}
          </p>
        </div>

        <form className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div>
            <label htmlFor="residenteId" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Residente
            </label>
            <select
              id="residenteId"
              name="residenteId"
              defaultValue={residenteId}
              className="mt-1 rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
            >
              <option value="">Todos</option>
              {residentes.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="desde" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Desde
            </label>
            <input
              id="desde"
              name="desde"
              type="date"
              defaultValue={desde}
              className="mt-1 rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:[color-scheme:dark]"
            />
          </div>

          <div>
            <label htmlFor="hasta" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Hasta
            </label>
            <input
              id="hasta"
              name="hasta"
              type="date"
              defaultValue={hasta}
              className="mt-1 rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:[color-scheme:dark]"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-zinc-800 px-4 py-2 text-sm text-white dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Filtrar
          </button>
          {hayFiltros && (
            <Link href="/dashboard/historial" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
              Limpiar filtros
            </Link>
          )}
        </form>

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Residente</th>
                <th className="px-4 py-3 font-medium">Tarea</th>
                <th className="px-4 py-3 font-medium">Campo</th>
                <th className="px-4 py-3 font-medium">Antes</th>
                <th className="px-4 py-3 font-medium">Después</th>
              </tr>
            </thead>
            <tbody>
              {cambios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500">
                    {hayFiltros ? 'No hay cambios que coincidan con el filtro.' : 'Todavía no hay cambios registrados.'}
                  </td>
                </tr>
              )}
              {cambios.map((cambio) => (
                <tr
                  key={cambio.id}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {new Date(cambio.fechaCambio).toLocaleString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/${cambio.residenteId}`}
                      className="font-medium text-zinc-900 hover:text-blue-600 hover:underline dark:text-zinc-100 dark:hover:text-blue-400"
                    >
                      {cambio.residenteNombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{cambio.tareaTitulo}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {ETIQUETA_CAMPO[cambio.campoModificado] ?? cambio.campoModificado}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">
                    {formatValor(cambio.campoModificado, cambio.valorAnterior)}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {formatValor(cambio.campoModificado, cambio.valorNuevo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
