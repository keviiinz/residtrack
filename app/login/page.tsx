'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { login } from './actions';
import { DevGridBackground } from '@/components/DevGridBackground';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 text-zinc-100">
      <DevGridBackground />

      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
          <span className="font-mono">←</span> Resid<span className="text-blue-400">Track</span>
        </Link>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl shadow-black/40 backdrop-blur">
          <h1 className="text-2xl font-semibold text-zinc-50">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-zinc-400">Entra con tu correo y contraseña.</p>

          <form action={action} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950/60 p-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              {state?.errors?.email && <p className="mt-1 text-xs text-red-400">{state.errors.email[0]}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950/60 p-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              {state?.errors?.password && <p className="mt-1 text-xs text-red-400">{state.errors.password[0]}</p>}
            </div>

            {state?.message && <p className="text-sm text-red-400">{state.message}</p>}

            <button
              disabled={pending}
              type="submit"
              className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 hover:shadow-blue-500/30 disabled:opacity-50"
            >
              {pending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            ¿Eres residente y no tienes cuenta?{' '}
            <Link href="/registro" className="text-blue-400 hover:text-blue-300 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
