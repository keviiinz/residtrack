import 'server-only';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'Evidencias';

export async function subirArchivo(path: string, archivo: File): Promise<void> {
  const bytes = await archivo.arrayBuffer();

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': archivo.type,
    },
    body: bytes,
  });

  if (!res.ok) {
    throw new Error(`No se pudo subir el archivo: ${res.status} ${await res.text()}`);
  }
}

export async function eliminarArchivo(path: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`No se pudo eliminar el archivo: ${res.status} ${await res.text()}`);
  }
}

export async function crearUrlFirmada(path: string, expiresInSegundos = 3600): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: expiresInSegundos }),
  });

  if (!res.ok) {
    throw new Error(`No se pudo firmar la URL: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { signedURL: string };
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}
