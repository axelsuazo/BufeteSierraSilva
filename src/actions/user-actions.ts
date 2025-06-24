'use server';

import { z } from 'zod';

// Esquema para el login de usuarios
const loginUserSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});
export type LoginUserData = z.infer<typeof loginUserSchema>;

// --- REGISTRO DE USUARIO DESHABILITADO PARA LOGIN SIMPLIFICADO ---
// export type RegisterUserData = any; //z.infer<typeof registerUserSchema>;
// export async function registerUserAction(
//   data: RegisterUserData
// ): Promise<{ success: boolean; user?: { id: string; email: string; name: string | null }; message: string; errors?: z.ZodIssue[] }> {
//   return { success: false, message: 'Funcionalidad de registro deshabilitada.' };
// }

// Credenciales predefinidas (INSEGURO PARA PRODUCCIÓN)
const PREDEFINED_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const PREDEFINED_PASSWORD = process.env.ADMIN_PASSWORD || "password123";
const PREDEFINED_USERNAME = "Administrador";

export async function loginUserAction(
  data: LoginUserData
): Promise<{ success: boolean; user?: { id: string; email: string; name: string | null }; message: string; errors?: z.ZodIssue[] }> {
  const validatedFields = loginUserSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Datos de inicio de sesión inválidos.',
      errors: validatedFields.error.issues,
    };
  }

  const { email, password } = validatedFields.data;

  if (email === PREDEFINED_EMAIL && password === PREDEFINED_PASSWORD) {
    // Simular un objeto de usuario
    const user = {
      id: 'predefined-admin-user',
      email: PREDEFINED_EMAIL,
      name: PREDEFINED_USERNAME,
    };
    return { success: true, user, message: 'Inicio de sesión exitoso.' };
  } else {
    return { success: false, message: 'Correo electrónico o contraseña incorrectos.' };
  }
}

// Puedes definir las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD en tu archivo .env
// Ejemplo .env:
// ADMIN_EMAIL=mi_admin@dominio.com
// ADMIN_PASSWORD=mi_contraseña_segura



