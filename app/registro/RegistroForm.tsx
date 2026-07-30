'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signup } from './actions';

export function RegistroForm({ emailInicial }: { emailInicial?: string }) {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-zinc-300">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          autoFocus={Boolean(emailInicial)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950/60 p-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        {state?.errors?.nombre && <p className="mt-1 text-xs text-red-400">{state.errors.nombre[0]}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={emailInicial}
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
        {state?.errors?.password && (
          <div className="mt-1 text-xs text-red-400">
            <p>La contraseña debe:</p>
            <ul className="list-inside list-disc">
              {state.errors.password.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="carrera" className="block text-sm font-medium text-zinc-300">
          Carrera
        </label>
        <input
          id="carrera"
          name="carrera"
          type="text"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950/60 p-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        {state?.errors?.carrera && <p className="mt-1 text-xs text-red-400">{state.errors.carrera[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-red-400">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 hover:shadow-blue-500/30 disabled:opacity-50"
      >
        {pending ? 'Registrando...' : 'Registrarme'}
      </button>

      <p className="text-center text-sm text-zinc-400">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
