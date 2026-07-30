ALTER TYPE "public"."evento_comentario" ADD VALUE 'cancelacion';--> statement-breakpoint
ALTER TABLE "comentarios" ADD COLUMN "visible_para_admin" boolean DEFAULT true NOT NULL;