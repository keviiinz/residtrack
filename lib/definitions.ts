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