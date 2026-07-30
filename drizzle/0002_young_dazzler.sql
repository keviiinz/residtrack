ALTER TABLE "tareas" RENAME COLUMN "tarea_id" TO "proyecto_id";--> statement-breakpoint
ALTER TABLE "tareas" DROP CONSTRAINT "tareas_tarea_id_proyectos_id_fk";
--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;