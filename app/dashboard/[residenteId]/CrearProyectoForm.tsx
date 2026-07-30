'use client';

import { useActionState } from 'react';
import { crearProyecto } from '@/app/dashboard/actions';

export function CrearProyectoForm({ residenteId }: { residenteId: string }) {
  const crearProyectoConResidente = crearProyecto.bind(null, residenteId);
  const [state, action, pending] = useActionState(crearProyectoConResidente, undefined);

  return (
    <form
      action={action}
      className="mt-8 space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Asignar proyecto</h2>

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nombre del proyecto
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-blue-500/50"
        />
        {state?.errors?.nombre && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.nombre[0]}</p>}
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-blue-500/50"
        />
        {state?.errors?.descripcion && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.descripcion[0]}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="fechaInicio" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fecha de inicio
          </label>
          <input
            id="fechaInicio"
            name="fechaInicio"
            type="date"
            className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:[color-scheme:dark] dark:focus:border-blue-500 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-blue-500/50"
          />
          {state?.errors?.fechaInicio && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.fechaInicio[0]}</p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="fechaFinEstimada" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fecha fin estimada
          </label>
          <input
            id="fechaFinEstimada"
            name="fechaFinEstimada"
            type="date"
            className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:[color-scheme:dark] dark:focus:border-blue-500 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-blue-500/50"
          />
          {state?.errors?.fechaFinEstimada && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.fechaFinEstimada[0]}</p>
          )}
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 dark:bg-blue-500 dark:shadow-lg dark:shadow-blue-500/20 dark:hover:bg-blue-400"
      >
        {pending ? 'Creando...' : 'Crear proyecto'}
      </button>
    </form>
  );
}
