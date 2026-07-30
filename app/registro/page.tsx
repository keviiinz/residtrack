import Link from 'next/link';
import { DevGridBackground } from '@/components/DevGridBackground';
import { RegistroForm } from './RegistroForm';

export default async function RegistroPage(props: PageProps<'/registro'>) {
  const params = await props.searchParams;
  const email = typeof params.email === 'string' ? params.email : undefined;

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 text-zinc-100">
      <DevGridBackground />

      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
          <span className="font-mono">←</span> Resid<span className="text-blue-400">Track</span>
        </Link>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl shadow-black/40 backdrop-blur">
          <h1 className="text-2xl font-semibold text-zinc-50">Registro de residente</h1>
          <p className="mt-1 text-sm text-zinc-400">Crea tu cuenta para dar seguimiento a tu residencia.</p>

          <RegistroForm emailInicial={email} />
        </div>
      </div>
    </div>
  );
}
