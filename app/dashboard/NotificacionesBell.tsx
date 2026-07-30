'use client';

import { useState, useTransition, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { marcarNotificacionesLeidas } from './actions';

type Notificacion = {
  id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  createdAt: Date;
};

export function NotificacionesBell({
  residenteId,
  notificaciones,
}: {
  residenteId: string;
  notificaciones: Notificacion[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [, startTransition] = useTransition();
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  function alternar(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const seVaAbrir = !abierto;
    setAbierto(seVaAbrir);
    if (seVaAbrir && noLeidas > 0) {
      startTransition(() => {
        marcarNotificacionesLeidas(residenteId);
      });
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={alternar}
        className="relative rounded-full p-1.5 text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Notificaciones"
      >
        🔔
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {noLeidas}
          </span>
        )}
      </button>

      {abierto &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onClick={() => setAbierto(false)}
          >
            <div
              className="my-8 w-full max-w-md rounded-lg border border-transparent bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Notificaciones</h3>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <p className="p-4 text-sm text-zinc-500 dark:text-zinc-500">Sin notificaciones.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {notificaciones.map((n) => (
                      <li
                        key={n.id}
                        className={`p-3 text-sm ${
                          n.leida
                            ? 'text-zinc-500 dark:text-zinc-500'
                            : 'bg-blue-50 font-medium text-zinc-900 dark:bg-blue-500/10 dark:text-zinc-100'
                        }`}
                      >
                        <p>{n.mensaje}</p>
                        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                          {new Date(n.createdAt).toLocaleString('es-MX')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
