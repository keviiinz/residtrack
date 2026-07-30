'use client';

import { useState } from 'react';
import { EditarTareaForm } from '@/app/cronograma/EditarTareaForm';
import { JustificarAtrasoForm } from '@/app/cronograma/JustificarAtrasoForm';
import { AgregarEvidenciaForm } from '@/app/cronograma/AgregarEvidenciaForm';
import { EditarEvidenciaForm } from '@/app/cronograma/EditarEvidenciaForm';
import { AgregarNotaForm } from '@/app/dashboard/AgregarNotaForm';

type EstadoTarea = 'pendiente' | 'en_curso' | 'completada' | 'retrasada' | 'cancelada';

type TareaGantt = {
  id: number;
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
  fechaInicioPlan: string;
  fechaFinPlan: string;
  requiereJustificacion: boolean;
};

type Comentario = {
  id: number;
  tipo: 'justificacion' | 'feedback';
  evento: 'reprogramacion' | 'adelanto' | 'atraso' | 'cancelacion' | null;
  contenido: string;
  visibleParaAdmin: boolean;
  autorNombre: string;
  comentarioPadreId: number | null;
  createdAt: Date;
};

type Evidencia = {
  id: number;
  fecha: string;
  titulo: string;
  descripcion: string | null;
  archivoTipo: 'imagen' | 'pdf';
  url: string;
};

type Props = {
  tareas: TareaGantt[];
  rol: 'residente' | 'admin';
  comentariosPorTarea?: Record<number, Comentario[]>;
  evidenciasPorTarea?: Record<number, Evidencia[]>;
};

const ANCHO_NUM = 36;
const ANCHO_TITULO = 176;
const ANCHO_INICIO = 72;
const ANCHO_DIAS = 52;
const ANCHO_FIN = 72;
const ANCHO_DIA = 28;

const ALTO_FILA = 40;
const ALTO_FILA_HEADER = 24;

const NOMBRES_MES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

const COLOR_ESTADO: Record<EstadoTarea, string> = {
  pendiente: 'bg-zinc-400',
  en_curso: 'bg-blue-500',
  completada: 'bg-green-500',
  retrasada: 'bg-red-500',
  cancelada: 'bg-zinc-600',
};

const ETIQUETA_ESTADO: Record<EstadoTarea, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completada: 'Completada',
  retrasada: 'Retrasada',
  cancelada: 'Cancelada',
};

function parseFecha(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function formatFechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio.slice(2)}`;
}

function esFinDeSemana(d: Date) {
  const dia = d.getDay();
  return dia === 0 || dia === 6;
}

function diasHabilesEntre(inicioIso: string, finIso: string): number {
  const inicio = parseFecha(inicioIso);
  const fin = parseFecha(finIso);
  let contador = 0;
  const actual = new Date(inicio);
  while (actual <= fin) {
    if (!esFinDeSemana(actual)) contador++;
    actual.setDate(actual.getDate() + 1);
  }
  return contador;
}

function generarRangoDeDias(inicio: Date, fin: Date): Date[] {
  const dias: Date[] = [];
  const actual = new Date(inicio);
  while (actual <= fin) {
    dias.push(new Date(actual));
    actual.setDate(actual.getDate() + 1);
  }
  return dias;
}

function agruparPorMes(dias: Date[]) {
  const grupos: { label: string; cantidad: number }[] = [];
  for (const dia of dias) {
    const label = `${NOMBRES_MES[dia.getMonth()]} ${dia.getFullYear()}`;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.label === label) {
      ultimo.cantidad += 1;
    } else {
      grupos.push({ label, cantidad: 1 });
    }
  }
  return grupos;
}

function mismoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function aIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

const ETIQUETA_TIPO_COMENTARIO: Record<Comentario['tipo'], string> = {
  justificacion: 'Justificación',
  feedback: 'Nota del admin',
};

const ETIQUETA_EVENTO: Record<NonNullable<Comentario['evento']>, string> = {
  reprogramacion: 'Reprogramación',
  adelanto: 'Adelanto',
  atraso: 'Atraso',
  cancelacion: 'Cancelación',
};

export function GanttChart({ tareas, rol, comentariosPorTarea = {}, evidenciasPorTarea = {} }: Props) {
  const [expandidaId, setExpandidaId] = useState<number | null>(null);
  const [filaHoverId, setFilaHoverId] = useState<number | null>(null);
  const [respondiendoId, setRespondiendoId] = useState<number | null>(null);
  const [notasExpandidas, setNotasExpandidas] = useState<Set<number>>(new Set());
  const [diaSeleccionado, setDiaSeleccionado] = useState<{ tareaId: number; fecha: string } | null>(null);
  const [editandoEvidenciaId, setEditandoEvidenciaId] = useState<number | null>(null);

  function alternarNotas(comentarioId: number) {
    setNotasExpandidas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(comentarioId)) {
        siguiente.delete(comentarioId);
      } else {
        siguiente.add(comentarioId);
      }
      return siguiente;
    });
  }

  if (tareas.length === 0) {
    return <p className="mt-8 text-zinc-500 dark:text-zinc-500">Este proyecto todavía no tiene tareas.</p>;
  }

  const fechaMinima = tareas.reduce(
    (min, t) => (t.fechaInicioPlan < min ? t.fechaInicioPlan : min),
    tareas[0].fechaInicioPlan
  );
  const fechaMaxima = tareas.reduce(
    (max, t) => (t.fechaFinPlan > max ? t.fechaFinPlan : max),
    tareas[0].fechaFinPlan
  );

  const dias = generarRangoDeDias(parseFecha(fechaMinima), parseFecha(fechaMaxima));
  const grupos = agruparPorMes(dias);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const tareaExpandida = tareas.find((t) => t.id === expandidaId) ?? null;
  const comentariosExpandida = tareaExpandida ? (comentariosPorTarea[tareaExpandida.id] ?? []) : [];

  function claseFila(tareaId: number) {
    const activa = expandidaId === tareaId || filaHoverId === tareaId;
    return activa ? 'bg-zinc-50 dark:bg-zinc-800/60' : '';
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
        <span>{tareas.length} tareas</span>
        <span>
          {formatFechaCorta(fechaMinima)} → {formatFechaCorta(fechaMaxima)}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(ETIQUETA_ESTADO) as EstadoTarea[]).map((estado) => (
            <span key={estado} className="flex items-center gap-1">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${COLOR_ESTADO[estado]}`} />
              {ETIQUETA_ESTADO[estado]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-start overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Tabla fija: datos de la tarea, sin scroll horizontal */}
        <table className="shrink-0 table-fixed border-collapse text-xs">
          <thead>
            <tr>
              <th
                className="border-b border-r border-zinc-200 bg-zinc-50 p-2 text-left dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                style={{ width: ANCHO_NUM, height: ALTO_FILA_HEADER * 2 }}
              >
                #
              </th>
              <th
                className="border-b border-r border-zinc-200 bg-zinc-50 p-2 text-left dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                style={{ width: ANCHO_TITULO, height: ALTO_FILA_HEADER * 2 }}
              >
                Tarea
              </th>
              <th
                className="border-b border-r border-zinc-200 bg-zinc-50 p-2 text-left dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                style={{ width: ANCHO_INICIO, height: ALTO_FILA_HEADER * 2 }}
              >
                Inicio
              </th>
              <th
                className="border-b border-r border-zinc-200 bg-zinc-50 p-2 text-left dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                style={{ width: ANCHO_DIAS, height: ALTO_FILA_HEADER * 2 }}
              >
                Días
              </th>
              <th
                className="border-b border-zinc-200 bg-zinc-50 p-2 text-left dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                style={{ width: ANCHO_FIN, height: ALTO_FILA_HEADER * 2 }}
              >
                Fin
              </th>
            </tr>
          </thead>
          <tbody>
            {tareas.map((tarea, index) => (
              <tr
                key={tarea.id}
                onClick={() => setExpandidaId(expandidaId === tarea.id ? null : tarea.id)}
                onMouseEnter={() => setFilaHoverId(tarea.id)}
                onMouseLeave={() => setFilaHoverId((actual) => (actual === tarea.id ? null : actual))}
                className={`cursor-pointer ${claseFila(tarea.id)}`}
                style={{ height: ALTO_FILA }}
              >
                <td
                  className="border-b border-r border-zinc-200 p-2 dark:border-zinc-800 dark:text-zinc-300"
                  style={{ height: ALTO_FILA }}
                >
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td
                  className="truncate border-b border-r border-zinc-200 p-2 font-medium dark:border-zinc-800 dark:text-zinc-100"
                  title={tarea.titulo}
                  style={{ height: ALTO_FILA }}
                >
                  {tarea.titulo}
                  {tarea.requiereJustificacion && <span className="ml-1 text-red-500 dark:text-red-400">●</span>}
                </td>
                <td
                  className="border-b border-r border-zinc-200 p-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                  style={{ height: ALTO_FILA }}
                >
                  {formatFechaCorta(tarea.fechaInicioPlan)}
                </td>
                <td
                  className="border-b border-r border-zinc-200 p-2 text-center text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                  style={{ height: ALTO_FILA }}
                >
                  {diasHabilesEntre(tarea.fechaInicioPlan, tarea.fechaFinPlan)}
                </td>
                <td
                  className="border-b border-zinc-200 p-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                  style={{ height: ALTO_FILA }}
                >
                  {formatFechaCorta(tarea.fechaFinPlan)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tabla del calendario, con su propio scroll horizontal */}
        <div
          className="min-w-0 flex-1 overflow-x-auto border-l border-zinc-200 dark:border-zinc-800
            [scrollbar-color:#a1a1aa_transparent] [scrollbar-width:thin] dark:[scrollbar-color:#52525b_transparent]
            [&::-webkit-scrollbar]:h-2.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600
            hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500 dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500"
        >
          <table className="table-fixed border-collapse text-xs">
            <thead>
              <tr>
                {grupos.map((grupo, i) => (
                  <th
                    key={i}
                    colSpan={grupo.cantidad}
                    className="border-b border-l border-zinc-200 bg-zinc-50 p-1 text-center font-medium text-zinc-500 first:border-l-0 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                    style={{ height: ALTO_FILA_HEADER }}
                  >
                    {grupo.label}
                  </th>
                ))}
              </tr>
              <tr>
                {dias.map((dia, i) => {
                  const esHoy = mismoDia(dia, hoy);
                  return (
                    <th
                      key={i}
                      className={`border-b border-zinc-200 p-1 text-center font-normal text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 ${
                        esFinDeSemana(dia) ? 'bg-zinc-100 dark:bg-zinc-800/60' : 'bg-white dark:bg-zinc-900'
                      }`}
                      style={{ width: ANCHO_DIA, height: ALTO_FILA_HEADER }}
                    >
                      {esHoy ? (
                        <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 font-semibold text-white">
                          {dia.getDate()}
                        </span>
                      ) : (
                        dia.getDate()
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tareas.map((tarea) => {
                const inicioTarea = parseFecha(tarea.fechaInicioPlan);
                const finTarea = parseFecha(tarea.fechaFinPlan);

                return (
                  <tr
                    key={tarea.id}
                    onClick={() => setExpandidaId(expandidaId === tarea.id ? null : tarea.id)}
                    onMouseEnter={() => setFilaHoverId(tarea.id)}
                    onMouseLeave={() => setFilaHoverId((actual) => (actual === tarea.id ? null : actual))}
                    className={`cursor-pointer ${claseFila(tarea.id)}`}
                    style={{ height: ALTO_FILA }}
                  >
                    {dias.map((dia, i) => {
                      const dentroDelRango = dia >= inicioTarea && dia <= finTarea && !esFinDeSemana(dia);
                      const esHoy = mismoDia(dia, hoy);
                      const diaIso = aIso(dia);
                      const tieneEvidencia = (evidenciasPorTarea[tarea.id] ?? []).some((ev) => ev.fecha === diaIso);
                      return (
                        <td
                          key={i}
                          onClick={(e) => {
                            if (!dentroDelRango) return;
                            e.stopPropagation();
                            setDiaSeleccionado({ tareaId: tarea.id, fecha: diaIso });
                            setEditandoEvidenciaId(null);
                          }}
                          className={`isolate border-b border-zinc-100 p-0 dark:border-zinc-800/60 ${dentroDelRango ? 'cursor-pointer' : ''} ${
                            esFinDeSemana(dia) && !dentroDelRango ? 'bg-zinc-50 dark:bg-zinc-900/40' : ''
                          } ${esHoy && !dentroDelRango ? 'bg-yellow-50 dark:bg-yellow-500/10' : ''}`}
                          style={{ width: ANCHO_DIA, height: ALTO_FILA }}
                        >
                          {dentroDelRango && (
                            <div className={`relative h-full w-full ${COLOR_ESTADO[tarea.estado]}`}>
                              {tieneEvidencia && (
                                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {tareaExpandida && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{tareaExpandida.titulo}</h3>
            <button
              type="button"
              onClick={() => setExpandidaId(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          </div>

          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{tareaExpandida.descripcion}</p>

          {(() => {
            const raices = comentariosExpandida.filter((c) => c.comentarioPadreId === null);
            const respuestasPorPadre = new Map<number, Comentario[]>();
            for (const c of comentariosExpandida) {
              if (c.comentarioPadreId !== null) {
                const lista = respuestasPorPadre.get(c.comentarioPadreId) ?? [];
                lista.push(c);
                respuestasPorPadre.set(c.comentarioPadreId, lista);
              }
            }

            return (
              raices.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {raices.map((c) => (
                    <li
                      key={c.id}
                      className="rounded border border-zinc-200 bg-white p-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/60"
                    >
                      <p className="flex flex-wrap items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                        {ETIQUETA_TIPO_COMENTARIO[c.tipo]}
                        {c.evento && ` · ${ETIQUETA_EVENTO[c.evento]}`} · {c.autorNombre}
                        {rol === 'residente' && !c.visibleParaAdmin && (
                          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-normal text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            🔒 Oculta para el admin
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400">{c.contenido}</p>
                      <p className="mt-1 text-zinc-400 dark:text-zinc-500">
                        {new Date(c.createdAt).toLocaleString('es-MX')}
                      </p>

                      {(() => {
                        const respuestas = respuestasPorPadre.get(c.id) ?? [];
                        if (respuestas.length === 0) return null;
                        const expandidas = notasExpandidas.has(c.id);
                        return (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => alternarNotas(c.id)}
                              className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
                            >
                              {expandidas ? '▾' : '▸'} {respuestas.length}{' '}
                              {respuestas.length === 1 ? 'nota' : 'notas'} del admin
                            </button>
                            {expandidas &&
                              respuestas.map((r) => (
                                <div
                                  key={r.id}
                                  className="ml-4 mt-2 rounded border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/60"
                                >
                                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                    {ETIQUETA_TIPO_COMENTARIO[r.tipo]}
                                    {r.evento && ` · ${ETIQUETA_EVENTO[r.evento]}`} · {r.autorNombre}
                                  </p>
                                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">{r.contenido}</p>
                                  <p className="mt-1 text-zinc-400 dark:text-zinc-500">
                                    {new Date(r.createdAt).toLocaleString('es-MX')}
                                  </p>
                                </div>
                              ))}
                          </div>
                        );
                      })()}

                      {rol === 'admin' &&
                        (respondiendoId === c.id ? (
                          <div className="ml-4 mt-2">
                            <AgregarNotaForm
                              tareaId={tareaExpandida.id}
                              comentarioPadreId={c.id}
                              placeholder="Responder a esta justificación..."
                              textoBoton="Responder"
                            />
                            <button
                              type="button"
                              onClick={() => setRespondiendoId(null)}
                              className="mt-1 text-xs text-zinc-400 hover:underline dark:text-zinc-500"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRespondiendoId(c.id)}
                            className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Responder
                          </button>
                        ))}
                    </li>
                  ))}
                </ul>
              )
            );
          })()}

          {rol === 'residente' ? (
            <>
              {tareaExpandida.requiereJustificacion && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-red-500 dark:text-red-400">
                    Requiere justificación por atraso
                  </p>
                  <JustificarAtrasoForm tareaId={tareaExpandida.id} />
                </div>
              )}
              <EditarTareaForm
                tareaId={tareaExpandida.id}
                estadoActual={tareaExpandida.estado}
                fechaInicioPlanActual={tareaExpandida.fechaInicioPlan}
                fechaFinPlanActual={tareaExpandida.fechaFinPlan}
              />
            </>
          ) : (
            <AgregarNotaForm tareaId={tareaExpandida.id} placeholder="Agregar nota general para el residente..." />
          )}
        </div>
      )}

      {diaSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setDiaSeleccionado(null);
            setEditandoEvidenciaId(null);
          }}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-transparent bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Evidencia · {formatFechaCorta(diaSeleccionado.fecha)}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDiaSeleccionado(null);
                  setEditandoEvidenciaId(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            {(evidenciasPorTarea[diaSeleccionado.tareaId] ?? [])
              .filter((ev) => ev.fecha === diaSeleccionado.fecha)
              .map((ev) =>
                editandoEvidenciaId === ev.id ? (
                  <EditarEvidenciaForm
                    key={ev.id}
                    evidenciaId={ev.id}
                    tituloActual={ev.titulo}
                    descripcionActual={ev.descripcion}
                    urlActual={ev.url}
                    archivoTipoActual={ev.archivoTipo}
                    onCancelar={() => setEditandoEvidenciaId(null)}
                  />
                ) : (
                  <div
                    key={ev.id}
                    className="mt-3 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{ev.titulo}</p>
                      {rol === 'residente' && (
                        <button
                          type="button"
                          onClick={() => setEditandoEvidenciaId(ev.id)}
                          className="shrink-0 text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    {ev.descripcion && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{ev.descripcion}</p>}
                    {ev.archivoTipo === 'imagen' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ev.url} alt={ev.titulo} className="mt-2 max-h-48 rounded" />
                    ) : (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Ver PDF
                      </a>
                    )}
                  </div>
                )
              )}

            {rol === 'residente' && (
              <AgregarEvidenciaForm tareaId={diaSeleccionado.tareaId} fecha={diaSeleccionado.fecha} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
