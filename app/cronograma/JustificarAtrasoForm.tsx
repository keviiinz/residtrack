'use client';

import { useActionState } from 'react';
import { justificarAtraso } from './actions';

export function JustificarAtrasoForm({ tareaId }: { tareaId: number }) {
  const justificarAtrasoConTarea = justificarAtraso.bind(null, tareaId);
  const [state, action, pending] = useActionState(justificarAtrasoConTarea, undefined);

  return (
    <form action={action} className="mt-3 space-y-2">
      <textarea
        name="contenido"
        placeholder="Explica por qué se atrasó esta tarea..."
        className="w-full rounded border border-red-300 p-2 text-sm dark:border-red-500/30 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder-zinc-600"
      />
      {state?.errors?.contenido && <p className="text-xs text-red-600 dark:text-red-400">{state.errors.contenido[0]}</p>}
      {state?.message && <p className="text-xs text-red-600 dark:text-red-400">{state.message}</p>}
      <button
        disabled={pending}
        type="submit"
        className="rounded bg-red-600 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400"
      >
        {pending ? 'Enviando...' : 'Justificar atraso'}
      </button>
    </form>
  );
}
