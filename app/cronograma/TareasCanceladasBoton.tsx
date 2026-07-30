'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { restaurarTarea } from './actions';

type TareaCancelada = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaInicioPlan: string;
  fechaFinPlan: string;
};

type Justificacion = {
  contenido: string;
  visibleParaAdmin: boolean;
  createdAt: Date;
};

type Props = {
  tareas: TareaCancelada[];
  justificacionesPorTarea: Record<number, Justificacion | undefined>;
};

function formatFechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio.slice(2)}`;
}

function RestaurarTareaForm({ tarea, onListo }: { tarea: TareaCancelada; onListo: () => void }) {
  const restaurarTareaConId = restaurarTarea.bind(null, tarea.id);
  const [state, action, pending] = useActionState(restaurarTareaConId, undefined);
  const estabaPendiente = useRef(false);

  useEffect(() => {
    if (estabaPendiente.current && !pending && !state?.errors && !state?.message) {
      onListo();
    }
    estabaPendiente.current = pending;
  }, [pending, state, onListo]);

  return (
    <form action={action} className="space-y-4 p-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Revisa que todo esté bien antes de devolver esta tarea al cronograma.
      </p>

      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          defaultValue={tarea.titulo}
          className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
        />
        {state?.errors?.titulo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.titulo[0]}</p>}
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          defaultValue={tarea.descripcion}
          className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
        />
        {state?.errors?.descripcion && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.descripcion[0]}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="fechaInicioPlan" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fecha de inicio
          </label>
          <input
            id="fechaInicioPlan"
            name="fechaInicioPlan"
            type="date"
            defaultValue={tarea.fechaInicioPlan}
            className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:[color-scheme:dark]"
          />
          {state?.errors?.fechaInicioPlan && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.fechaInicioPlan[0]}</p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="fechaFinPlan" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fecha fin
          </label>
          <input
            id="fechaFinPlan"
            name="fechaFinPlan"
            type="date"
            defaultValue={tarea.fechaFinPlan}
            className="mt-1 w-full rounded border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:[color-scheme:dark]"
          />
          {state?.errors?.fechaFinPlan && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{state.errors.fechaFinPlan[0]}</p>
          )}
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onListo} className="rounded px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
          Cancelar
        </button>
        <button
          disabled={pending}
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {pending ? 'Restaurando...' : 'Restaurar al cronograma'}
        </button>
      </div>
    </form>
  );
}

export function TareasCanceladasBoton({ tareas, justificacionesPorTarea }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [tareaRestaurando, setTareaRestaurando] = useState<TareaCancelada | null>(null);

  function cerrar() {
    setAbierto(false);
    setTareaRestaurando(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="relative rounded-full p-1.5 text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Tareas canceladas"
        title="Tareas canceladas"
      >
        🗑️
        {tareas.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-600 px-1 text-[10px] font-medium text-white">
            {tareas.length}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={cerrar}
        >
          <div
            className="my-8 w-full max-w-md rounded-lg border border-transparent bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {tareaRestaurando ? `Restaurar · ${tareaRestaurando.titulo}` : 'Tareas canceladas'}
              </h3>
              <button
                type="button"
                onClick={cerrar}
                className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {tareaRestaurando ? (
                <RestaurarTareaForm tarea={tareaRestaurando} onListo={cerrar} />
              ) : tareas.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500 dark:text-zinc-500">No hay tareas canceladas.</p>
              ) : (
                <ul className="space-y-3 p-4">
                  {tareas.map((tarea) => {
                    const justificacion = justificacionesPorTarea[tarea.id];
                    return (
                      <li
                        key={tarea.id}
                        className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{tarea.titulo}</p>
                          <button
                            type="button"
                            onClick={() => setTareaRestaurando(tarea)}
                            className="shrink-0 text-xs text-blue-600 hover:underline dark:text-blue-400"
                            title="Devolver al cronograma"
                          >
                            ↩ Restaurar
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                          {formatFechaCorta(tarea.fechaInicioPlan)} → {formatFechaCorta(tarea.fechaFinPlan)}
                        </p>
                        {justificacion ? (
                          <>
                            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{justificacion.contenido}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                              {new Date(justificacion.createdAt).toLocaleString('es-MX')}
                              {!justificacion.visibleParaAdmin && (
                                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                  🔒 Oculta para el admin
                                </span>
                              )}
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 italic text-zinc-400 dark:text-zinc-500">Sin justificación registrada.</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
