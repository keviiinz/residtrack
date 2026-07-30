import Link from 'next/link';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { DevGridBackground } from '@/components/DevGridBackground';

const CARACTERISTICAS: { iconoSvg?: string; icono?: string; titulo: string; descripcion: string }[] = [
  {
    iconoSvg: '/svgs/estadisticas.svg',
    titulo: 'Cronograma visual',
    descripcion: 'Cada tarea se ve como una barra en un calendario tipo Gantt, con su estado y su rango de fechas de un vistazo.',
  },
  {
    iconoSvg: '/svgs/clip-de-papel.svg',
    titulo: 'Evidencia por día',
    descripcion: 'Sube una foto o un PDF como evidencia directo en el día correspondiente de cada tarea.',
  },
  {
    iconoSvg: '/svgs/noti-bell.svg',
    titulo: 'Notificaciones al instante',
    descripcion: 'Los administradores se enteran al momento de reprogramaciones, atrasos y justificaciones de cada residente.',
  },
];

export default async function Home() {
  const cookie = (await cookies()).get('session')?.value;
  const session = await decrypt(cookie);
  const rutaInicio = session?.rol === 'admin' ? '/dashboard' : '/cronograma';

  return (
    <div className="relative min-h-screen text-zinc-100">
      <DevGridBackground />

      <main className="mx-auto max-w-5xl px-6 py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 font-mono text-xs text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              seguimiento de residencias
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-zinc-50">
              Céntrate en tu residencia, no en el papeleo
            </h1>
            <p className="mt-4 max-w-md text-lg text-zinc-400">
              Cronograma, evidencia y justificaciones en un solo lugar. Tu asesor se entera al instante de cualquier
              cambio.
            </p>

            {session?.userId && (
              <Link
                href={rutaInicio}
                className="mt-8 inline-block rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 hover:shadow-blue-500/30"
              >
                Ir a mi {rutaInicio === '/dashboard' ? 'panel' : 'cronograma'}
              </Link>
            )}
          </div>

          {!session?.userId && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl shadow-black/40 backdrop-blur">
              <form action="/registro" method="GET" className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                  Correo
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="tunombre@correo.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950/60 p-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
                <p className="pb-2 text-xs text-zinc-500">Usa el correo con el que vas a llevar tu residencia.</p>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 hover:shadow-blue-500/30"
                >
                  Unirme
                </button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-zinc-600">
                <div className="h-px flex-1 bg-zinc-800" />
                o
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <Link
                href="/login"
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-900/60 py-2.5 text-center text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Ya tengo cuenta · Iniciar sesión
              </Link>
            </div>
          )}
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-3">
          {CARACTERISTICAS.map((c) => (
            <div
              key={c.titulo}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur transition hover:border-blue-500/50 hover:bg-zinc-900/70"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-lg">
                {c.iconoSvg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.iconoSvg} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  c.icono
                )}
              </span>
              <h2 className="mt-4 text-sm font-semibold text-zinc-100">{c.titulo}</h2>
              <p className="mt-2 text-sm text-zinc-400">{c.descripcion}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
