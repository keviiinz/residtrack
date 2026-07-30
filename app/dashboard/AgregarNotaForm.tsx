'use client';

import { useActionState } from 'react';
import { agregarNota } from './actions';

type Props = {
  tareaId: number;
  comentarioPadreId?: number;
  placeholder?: string;
  textoBoton?: string;
};

export function AgregarNotaForm({
  tareaId,
  comentarioPadreId,
  placeholder = 'Deja una nota para el residente...',
  textoBoton = 'Agregar nota',
}: Props) {
  const agregarNotaConTarea = agregarNota.bind(null, tareaId);
  const [state, action, pending] = useActionState(agregarNotaConTarea, undefined);

  return (
    <form action={action} className="mt-3 space-y-2">
      {comentarioPadreId !== undefined && (
        <input type="hidden" name="comentarioPadreId" value={comentarioPadreId} />
      )}
      <textarea
        name="contenido"
        placeholder={placeholder}
        className="w-full rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder-zinc-600"
      />
      {state?.errors?.contenido && <p className="text-xs text-red-600 dark:text-red-400">{state.errors.contenido[0]}</p>}
      {state?.message && <p className="text-xs text-red-600 dark:text-red-400">{state.message}</p>}
      <button
        disabled={pending}
        type="submit"
        className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        {pending ? 'Guardando...' : textoBoton}
      </button>
    </form>
  );
}
