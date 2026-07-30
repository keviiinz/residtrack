CREATE TYPE "public"."tipo_archivo" AS ENUM('imagen', 'pdf');--> statement-breakpoint
CREATE TABLE "evidencias" (
	"id" serial PRIMARY KEY NOT NULL,
	"tarea_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descripcion" text,
	"archivo_path" text NOT NULL,
	"archivo_tipo" "tipo_archivo" NOT NULL,
	"autor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_tarea_id_tareas_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tareas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;