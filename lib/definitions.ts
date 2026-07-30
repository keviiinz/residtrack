import { z } from "zod";

export const SignupFormSchema = z.object({
    nombre: z.string().min(2, {message: 'El nombre debe tener al menos 2 caracteres.' }).trim(),
    email: z.string().email({ message: 'Correo inválido.' }).trim(),
    password: z
        .string()
        .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
        .regex(/[a-zA-Z]/, { message: 'Debe contener al menos una letra.' })
        .regex(/[0-9]/, { message: 'Debe contener al menos un número.' })
        .trim(),
    carrera: z.string().min(2, { message: 'Ingresa tu carrera.' }).trim(),
    });

export type FormState =
  | {
      errors?: {
        nombre?: string[];
        email?: string[];
        password?: string[];
        carrera?: string[];
      };
      message?: string;
    }
  | undefined;

  export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Correo inválido.' }).trim(),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }).trim(),
});

export const ProyectoFormSchema = z
  .object({
    nombre: z.string().min(2, { message: 'El nombre del proyecto es requerido.' }).trim(),
    descripcion: z.string().min(1, { message: 'La descripción es requerida.' }).trim(),
    fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida.' }),
    fechaFinEstimada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida.' }),
  })
  .refine((data) => data.fechaFinEstimada >= data.fechaInicio, {
    message: 'La fecha fin estimada debe ser posterior a la fecha de inicio.',
    path: ['fechaFinEstimada'],
  });

export type ProyectoFormState =
  | {
      errors?: {
        nombre?: string[];
        descripcion?: string[];
        fechaInicio?: string[];
        fechaFinEstimada?: string[];
      };
      message?: string;
    }
  | undefined;

export const TareaFormSchema = z
  .object({
    titulo: z.string().min(2, { message: 'El título es requerido.' }).trim(),
    descripcion: z.string().min(1, { message: 'La descripción es requerida.' }).trim(),
    fechaInicioPlan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida.' }),
    fechaFinPlan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida.' }),
  })
  .refine((data) => data.fechaFinPlan >= data.fechaInicioPlan, {
    message: 'La fecha fin debe ser posterior a la fecha de inicio.',
    path: ['fechaFinPlan'],
  });

export type TareaFormState =
  | {
      errors?: {
        titulo?: string[];
        descripcion?: string[];
        fechaInicioPlan?: string[];
        fechaFinPlan?: string[];
      };
      message?: string;
    }
  | undefined;

export const JustificacionFormSchema = z.object({
  contenido: z.string().min(5, { message: 'Escribe una justificación más detallada.' }).trim(),
});

export type JustificacionFormState =
  | {
      errors?: {
        contenido?: string[];
      };
      message?: string;
    }
  | undefined;

export const EditarTareaFormSchema = z
  .object({
    fechaInicioPlan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida.' }),
    fechaFinPlan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida.' }),
    estado: z.enum(['pendiente', 'en_curso', 'completada', 'cancelada']),
  })
  .refine((data) => data.fechaFinPlan >= data.fechaInicioPlan, {
    message: 'La fecha fin debe ser posterior a la fecha de inicio.',
    path: ['fechaFinPlan'],
  });

export type EditarTareaFormState =
  | {
      errors?: {
        fechaInicioPlan?: string[];
        fechaFinPlan?: string[];
        estado?: string[];
      };
      message?: string;
    }
  | undefined;

export const NotaFormSchema = z.object({
  contenido: z.string().min(2, { message: 'Escribe una nota antes de guardar.' }).trim(),
});

export type NotaFormState =
  | {
      errors?: {
        contenido?: string[];
      };
      message?: string;
    }
  | undefined;

export type EvidenciaFormState =
  | {
      errors?: {
        titulo?: string[];
      };
      message?: string;
    }
  | undefined;