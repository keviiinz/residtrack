'use client';

import { useActionState, useState, useEffect, useRef, type FormEvent } from 'react';
import { editarTarea } from './actions';

type EstadoEditable = 'pendiente' | 'en_curso' | 'completada' | 'cancelada';

type Props = {
  tareaId: number;
  estadoActual: EstadoEditable | 'retrasada';
  fechaInicioPlanActual: string;
  fechaFinPlanActual: string;
};

export function EditarTareaForm({
  tareaId,
  estadoActual,
  fechaInicioPlanActual,
  fechaFinPlanActual,
}: Props) {
  const editarTareaConId = editarTarea.bind(null, tareaId);
  const [state, action, pending] = useActionState(editarTareaConId, undefined);

  const [fechaInicioPlan, setFechaInicioPlan] = useState(fechaInicioPlanActual);
  const [fechaFinPlan, setFechaFinPlan] = useState(fechaFinPlanActual);
  const [estado, setEstado] = useState<EstadoEditable>(
    estadoActual === 'retrasada' ? 'pendiente' : estadoActual
  );
  const [mostrarJustificacion, setMostrarJustificacion] = useState(false);
  const [justificacion, setJustificacion] = useState('');
  const [visibleParaAdmin, setVisibleParaAdmin] = useState(true);

  const hoy = new Date().toISOString().slice(0, 10);
  const esReprogramacion =
    fechaInicioPlan !== fechaInicioPlanActual || fechaFinPlan !== fechaFinPlanActual;
  const esAdelanto =
    estado === 'completada' && estadoActual !== 'completada' && hoy < fechaFinPlanActual;
  const esCancelacion = estado === 'cancelada' && estadoActual !== 'cancelada';
  const necesitaJustificacion = esReprogramacion || esAdelanto || esCancelacion;

  const formId = `editar-tarea-${tareaId}`;

  const estabaPendiente = useRef(false);

  useEffect(() => {
    if (estabaPendiente.current && !pending && !state?.errors && !state?.message) {
      setMostrarJustificacion(false);
      setJustificacion('');
      setVisibleParaAdmin(true);
    }
    estabaPendiente.current = pending;
  }, [pending, state]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (necesitaJustificacion && !mostrarJustificacion) {
      e.preventDefault();
      setMostrarJustificacion(true);
    }
  }

  return (
    <>
      <form
        id={formId}
        action={action}
        onSubmit={handleSubmit}
        className="mt-3 flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3 dark:border-zinc-800"
      >
        <input
          type="date"
          name="fechaInicioPlan"
          value={fechaInicioPlan}
          onChange={(e) => setFechaInicioPlan(e.target.value)}
          className="rounded border border-zinc-300 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:[color-scheme:dark]"
        />
        <input
          type="date"
          name="fechaFinPlan"
          value={fechaFinPlan}
          onChange={(e) => setFechaFinPlan(e.target.value)}
          className="rounded border border-zinc-300 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:[color-scheme:dark]"
        />
        <select
          name="estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoEditable)}
          className="rounded border border-zinc-300 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_curso">En curso</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <input type="hidden" name="justificacion" value={justificacion} />
        <input type="hidden" name="visibleParaAdmin" value={visibleParaAdmin ? 'true' : 'false'} />

        <button
          disabled={pending}
          type="submit"
          className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {pending ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {state?.errors?.fechaInicioPlan && (
          <p className="w-full text-xs text-red-600 dark:text-red-400">{state.errors.fechaInicioPlan[0]}</p>
        )}
        {state?.errors?.fechaFinPlan && (
          <p className="w-full text-xs text-red-600 dark:text-red-400">{state.errors.fechaFinPlan[0]}</p>
        )}
        {state?.message && <p className="w-full text-xs text-red-600 dark:text-red-400">{state.message}</p>}
      </form>

      {mostrarJustificacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-transparent bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {esReprogramacion
                ? 'Justifica la reprogramación'
                : esAdelanto
                  ? 'Justifica el adelanto'
                  : 'Justifica la cancelación'}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {esReprogramacion
                ? 'Cambiaste las fechas planeadas de esta tarea. Explica por qué antes de guardar.'
                : esAdelanto
                  ? 'Estás completando esta tarea antes de la fecha planeada. Explica por qué antes de guardar.'
                  : 'Estás cancelando esta tarea. Explica por qué antes de guardar.'}
            </p>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              className="mt-3 w-full rounded border border-zinc-300 p-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
              rows={4}
              autoFocus
            />

            {esCancelacion && (
              <label className="mt-3 flex cursor-pointer items-center gap-2">
                <span className="relative inline-block h-5 w-9 shrink-0">
                  <input
                    type="checkbox"
                    checked={visibleParaAdmin}
                    onChange={(e) => setVisibleParaAdmin(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="block h-5 w-9 rounded-full bg-zinc-300 transition-colors peer-checked:bg-blue-600 dark:bg-zinc-700 dark:peer-checked:bg-blue-500" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                </span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {visibleParaAdmin ? 'El admin puede ver esta justificación' : 'Oculta para el admin'}
                </span>
              </label>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarJustificacion(false)}
                className="rounded px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400"
              >
                Cancelar
              </button>
              <button
                form={formId}
                type="submit"
                disabled={justificacion.trim().length < 5}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
