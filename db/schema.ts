import {
    pgTable,
    pgEnum,
    uuid,
    serial,
    text,
    timestamp,
    varchar,
    date,
    boolean,
    integer,
} from 'drizzle-orm/pg-core';

// --- ENUMS ---

export const rolEnum = pgEnum('rol', ['admin', 'residente']);
export const estadoUsuarioEnum = pgEnum('estado_usuario', ['activo', 'finalizado', 'baja']);
export const estadoProyectoEnum = pgEnum('estado_proyecto', ['activo', 'completado', 'cancelado']);
export const estadoTareaEnum = pgEnum('estado_tarea', ['pendiente', 'en_curso', 'completada', 'retrasada', 'cancelada']);
export const prioridadTareaEnum = pgEnum('prioridad_tarea', ['baja', 'media', 'alta']);
export const tipoComentarioEnum = pgEnum('tipo_comentario', ['justificacion', 'feedback']);
export const eventoComentarioEnum = pgEnum('evento_comentario', ['reprogramacion', 'adelanto', 'atraso']);
export const tipoNotificacionEnum = pgEnum('tipo_notificacion', ['cambio_cronograma', 'tarea_retrasada', 'tarea_adelantada', 'tarea_cancelada', 'comentario_nuevo']);

// --- USUARIO ---

export const usuarios = pgTable('usuarios', {
    id: uuid('id').defaultRandom().primaryKey(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    rol: rolEnum('rol').notNull(),
    carrera: varchar('carrera', { length: 255 }),
    fechaInicioResidencia: date('fecha_inicio_residencia'),
    fechaFinResidencia: date('fecha_fin_residencia'),
    estado: estadoUsuarioEnum('estado').notNull().default('activo'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// --- PROYECTO ---

export const proyectos = pgTable('proyectos', {
    id: serial('id').primaryKey(),
    residenteId: uuid('residente_id').notNull().references(() => usuarios.id),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    descripcion: text('descripcion').notNull(),
    fechaInicio: date('fecha_inicio').notNull(),
    fechaFinEstimada: date('fecha_fin').notNull(),
    estado: estadoProyectoEnum('estado').notNull().default('activo'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// --- TAREA  ---

export const tareas = pgTable('tareas', {
    id: serial('id').primaryKey(),
    tareaId: integer('tarea_id').notNull().references(() => proyectos.id),
    titulo: varchar('titulo', { length: 255 }).notNull(),
    descripcion: text('descripcion').notNull(),
    fechaInicioPlan: date('fecha_inicio').notNull(),
    fechaFinPlan: date('fecha_fin').notNull(),
    fechaInicioReal: date('fecha_inicio_real'),
    fechaFinReal: date('fecha_fin_real'),
    estado: estadoTareaEnum('estado').notNull().default('pendiente'),
    orden: integer('orden').notNull(),
    requiereJustificacion: boolean('requiere_justificacion').notNull().default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),    
});

// --- HISTORIAL_CAMBIOS ---

export const historialCambios = pgTable('historial_cambios', {
    id: serial('id').primaryKey(),
    tareaId: integer('tarea_id').notNull().references(() => tareas.id),
    usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id),
    campoModificado: varchar('campo_modificado', { length: 100 }).notNull(),
    valorAnterior: text('valor_anterior').notNull(),
    valorNuevo: text('valor_nuevo').notNull(),
    fechaCambio: timestamp('fecha_cambio').notNull().defaultNow(),
});

// ---COMENTARIO ---

export const comentarios = pgTable('comentarios', {
    id: serial('id').primaryKey(),
    tareaId: integer('tarea_id').notNull().references(() => tareas.id),
    autorId: uuid('autor_id').notNull().references(() => usuarios.id),
    tipo: tipoComentarioEnum('tipo').notNull(),
    evento: eventoComentarioEnum('evento').notNull(),
    contenido: text('contenido').notNull(),
    resuelto: boolean('resuelto').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// --- NOTIFICACION ---

export const notificaciones = pgTable('notificaciones', {
   id: serial('id').primaryKey(),
   usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id), 
   tipo: tipoNotificacionEnum('tipo').notNull(),
   mensaje: text('mensaje').notNull(),
   leida: boolean('leida').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});