CREATE TYPE "public"."estado_proyecto" AS ENUM('activo', 'completado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."estado_tarea" AS ENUM('pendiente', 'en_curso', 'completada', 'retrasada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."estado_usuario" AS ENUM('activo', 'finalizado', 'baja');--> statement-breakpoint
CREATE TYPE "public"."evento_comentario" AS ENUM('reprogramacion', 'adelanto', 'atraso');--> statement-breakpoint
CREATE TYPE "public"."prioridad_tarea" AS ENUM('baja', 'media', 'alta');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('admin', 'residente');--> statement-breakpoint
CREATE TYPE "public"."tipo_comentario" AS ENUM('justificacion', 'feedback');--> statement-breakpoint
CREATE TYPE "public"."tipo_notificacion" AS ENUM('cambio_cronograma', 'tarea_retrasada', 'tarea_adelantada', 'tarea_cancelada', 'comentario_nuevo');--> statement-breakpoint
CREATE TABLE "comentarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"tarea_id" integer NOT NULL,
	"autor_id" uuid NOT NULL,
	"tipo" "tipo_comentario" NOT NULL,
	"evento" "evento_comentario" NOT NULL,
	"contenido" text NOT NULL,
	"resuelto" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historial_cambios" (
	"id" serial PRIMARY KEY NOT NULL,
	"tarea_id" integer NOT NULL,
	"usuario_id" uuid NOT NULL,
	"campo_modificado" varchar(100) NOT NULL,
	"valor_anterior" text NOT NULL,
	"valor_nuevo" text NOT NULL,
	"fecha_cambio" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" "tipo_notificacion" NOT NULL,
	"mensaje" text NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proyectos" (
	"id" serial PRIMARY KEY NOT NULL,
	"residente_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"estado" "estado_proyecto" DEFAULT 'activo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tareas" (
	"id" serial PRIMARY KEY NOT NULL,
	"tarea_id" integer NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descripcion" text NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"fecha_inicio_real" date,
	"fecha_fin_real" date,
	"estado" "estado_tarea" DEFAULT 'pendiente' NOT NULL,
	"orden" integer NOT NULL,
	"requiere_justificacion" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"rol" "rol" NOT NULL,
	"carrera" varchar(255) NOT NULL,
	"fecha_inicio_residencia" date NOT NULL,
	"fecha_fin_residencia" date NOT NULL,
	"estado" "estado_usuario" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_tarea_id_tareas_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tareas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_cambios" ADD CONSTRAINT "historial_cambios_tarea_id_tareas_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tareas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_cambios" ADD CONSTRAINT "historial_cambios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_residente_id_usuarios_id_fk" FOREIGN KEY ("residente_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_tarea_id_proyectos_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;