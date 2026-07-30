ALTER TABLE "usuarios" ALTER COLUMN "carrera" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "fecha_inicio_residencia" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "fecha_fin_residencia" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "estado" SET DEFAULT 'activo';