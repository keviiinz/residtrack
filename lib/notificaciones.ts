import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { usuarios, notificaciones, tipoNotificacionEnum } from '@/db/schema';

type TipoNotificacion = (typeof tipoNotificacionEnum.enumValues)[number];

export async function notificarAdmins(tareaId: number, tipo: TipoNotificacion, mensaje: string) {
  const admins = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.rol, 'admin'));

  if (admins.length === 0) return;

  await db.insert(notificaciones).values(
    admins.map((admin) => ({
      usuarioId: admin.id,
      tareaId,
      tipo,
      mensaje,
    }))
  );
}

export async function notificarUsuario(
  usuarioId: string,
  tareaId: number,
  tipo: TipoNotificacion,
  mensaje: string
) {
  await db.insert(notificaciones).values({ usuarioId, tareaId, tipo, mensaje });
}
