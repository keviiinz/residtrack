'use client';

import { useActionState, useEffect, useState, type ChangeEvent } from 'react';
import { agregarEvidencia } from './actions';

const ANCHO_MAXIMO = 1600;

async function comprimirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith('image/') || archivo.type === 'image/gif') {
    return archivo;
  }

  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, ANCHO_MAXIMO / bitmap.width);
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return archivo;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.7));
    if (!blob) return archivo;

    return new File([blob], archivo.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return archivo;
  }
}

export function AgregarEvidenciaForm({ tareaId, fecha }: { tareaId: number; fecha: string }) {
  const agregarEvidenciaConTareaYFecha = agregarEvidencia.bind(null, tareaId, fecha);
  const [state, action, pending] = useActionState(agregarEvidenciaConTareaYFecha, undefined);
  const [procesando, setProcesando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [esPdf, setEsPdf] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const seleccionado = input.files?.[0];

    setPreviewUrl((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return null;
    });

    if (!seleccionado) {
      setNombreArchivo(null);
      setEsPdf(false);
      return;
    }

    if (seleccionado.type === 'application/pdf') {
      setNombreArchivo(seleccionado.name);
      setEsPdf(true);
      return;
    }

    if (!seleccionado.type.startsWith('image/')) return;

    setEsPdf(false);
    setProcesando(true);
    const comprimido = await comprimirImagen(seleccionado);
    setProcesando(false);

    const dt = new DataTransfer();
    dt.items.add(comprimido);
    input.files = dt.files;

    setNombreArchivo(comprimido.name);
    setPreviewUrl(URL.createObjectURL(comprimido));
  }

  return (
    <form action={action} className="mt-3 space-y-2 rounded border border-zinc-200 p-3 dark:border-zinc-800">
      <input
        name="titulo"
        type="text"
        placeholder="Título de la evidencia"
        className="w-full rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder-zinc-600"
      />
      {state?.errors?.titulo && <p className="text-xs text-red-600 dark:text-red-400">{state.errors.titulo[0]}</p>}

      <textarea
        name="descripcion"
        placeholder="Descripción (opcional)"
        className="w-full rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder-zinc-600"
      />

      <input
        name="archivo"
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="w-full text-sm dark:text-zinc-400"
      />

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={nombreArchivo ?? 'Vista previa'} className="max-h-48 rounded border border-zinc-200 dark:border-zinc-800" />
      )}

      {esPdf && nombreArchivo && (
        <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">📄 {nombreArchivo}</p>
      )}

      {state?.message && <p className="text-xs text-red-600 dark:text-red-400">{state.message}</p>}

      <button
        disabled={pending || procesando}
        type="submit"
        className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        {procesando ? 'Procesando imagen...' : pending ? 'Subiendo...' : 'Subir evidencia'}
      </button>
    </form>
  );
}
