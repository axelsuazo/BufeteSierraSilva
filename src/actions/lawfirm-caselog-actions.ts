
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import type { BitacoraClienteBufete as PrismaBitacoraClienteBufete } from '@prisma/client';

// Esquema Zod para la validación de la entrada al agregar una entrada de bitácora
const caseLogEntrySchema = z.object({
  descripcion: z.string().min(5, { message: 'La descripción debe tener al menos 5 caracteres.' }).max(1000, {message: 'La descripción no puede exceder los 1000 caracteres.'}),
  tipoActuacion: z.string().optional(),
  clienteId: z.string().cuid({ message: 'ID de cliente inválido.' }),
});

export type CaseLogEntryFormData = z.infer<typeof caseLogEntrySchema>;

// Esquema para actualizar una entrada (solo descripción y tipoActuacion pueden cambiar)
const updateCaseLogEntrySchema = z.object({
  descripcion: z.string().min(5, { message: 'La descripción debe tener al menos 5 caracteres.' }).max(1000, {message: 'La descripción no puede exceder los 1000 caracteres.'}).optional(),
  tipoActuacion: z.string().optional().nullable(), // Permitir string o null
});
export type UpdateCaseLogEntryFormData = z.infer<typeof updateCaseLogEntrySchema>;


// Acción para agregar una nueva entrada a la bitácora de un cliente
export async function agregarEntradaBitacoraClienteAccion(
  data: CaseLogEntryFormData
): Promise<{ success: boolean; entrada?: PrismaBitacoraClienteBufete; message: string; errors?: z.ZodIssue[] }> {
  const validatedFields = caseLogEntrySchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Error de validación al agregar entrada de bitácora:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Datos inválidos. Por favor, revise la información.",
      errors: validatedFields.error.issues,
    };
  }

  try {
    const cliente = await prisma.clienteBufete.findUnique({
      where: { id: validatedFields.data.clienteId },
    });

    if (!cliente) {
      return { success: false, message: 'Error: El cliente especificado no existe.' };
    }

    const nuevaEntrada = await prisma.bitacoraClienteBufete.create({
      data: {
        descripcion: validatedFields.data.descripcion,
        tipoActuacion: validatedFields.data.tipoActuacion || null,
        clienteId: validatedFields.data.clienteId,
      },
    });
    return { success: true, entrada: nuevaEntrada, message: 'Entrada de bitácora agregada con éxito.' };
  } catch (error: any) {
    console.error('Error al agregar entrada de bitácora:', error);
    return { success: false, message: 'Error interno al agregar la entrada de bitácora.' };
  }
}

// Acción para listar todas las entradas de bitácora de un cliente específico
export async function listarEntradasBitacoraClienteAccion(
  clienteId: string
): Promise<{
  success: boolean;
  entradas?: PrismaBitacoraClienteBufete[];
  message?: string;
}> {
  if (!clienteId) {
    return { success: false, message: 'ID de cliente no proporcionado.' };
  }

  try {
    const entradas = await prisma.bitacoraClienteBufete.findMany({
      where: {
        clienteId: clienteId,
      },
      orderBy: {
        fechaEntrada: 'desc', 
      },
    });
    return { success: true, entradas };
  } catch (error) {
    console.error('Error al listar entradas de bitácora del cliente:', error);
    return { success: false, message: 'Error al cargar las entradas de la bitácora.' };
  }
}

// Acción para actualizar una entrada de bitácora
export async function actualizarEntradaBitacoraClienteAccion(
  id: string,
  data: UpdateCaseLogEntryFormData
): Promise<{ success: boolean; entrada?: PrismaBitacoraClienteBufete; message: string; errors?: z.ZodIssue[] }> {
  const validatedFields = updateCaseLogEntrySchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos inválidos para actualizar. Por favor, revise la información.",
      errors: validatedFields.error.issues,
    };
  }
  
  const updateData: Partial<PrismaBitacoraClienteBufete> = {};
  if (validatedFields.data.descripcion !== undefined) {
    updateData.descripcion = validatedFields.data.descripcion;
  }
  // Manejar tipoActuacion para permitir string vacío como null, o un valor string.
  if (validatedFields.data.tipoActuacion !== undefined) {
    updateData.tipoActuacion = validatedFields.data.tipoActuacion === '' ? null : validatedFields.data.tipoActuacion;
  }


  if (Object.keys(updateData).length === 0) {
    return { success: true, message: "No se proporcionaron datos para actualizar. No se realizaron cambios." };
  }

  try {
    const entradaActualizada = await prisma.bitacoraClienteBufete.update({
      where: { id },
      data: updateData,
    });
    return { success: true, entrada: entradaActualizada, message: 'Entrada de bitácora actualizada con éxito.' };
  } catch (error: any) {
    console.error('Error al actualizar entrada de bitácora:', error);
    if (error.code === 'P2025') { // Record to update not found.
      return { success: false, message: 'Error: La entrada de bitácora que intenta actualizar no existe.' };
    }
    return { success: false, message: 'Error interno al actualizar la entrada de bitácora.' };
  }
}

// Acción para eliminar una entrada de bitácora
export async function eliminarEntradaBitacoraClienteAccion(
  id: string
): Promise<{ success: boolean; message: string }> {
   if (!id) {
    return { success: false, message: 'ID de entrada de bitácora no proporcionado.' };
  }
  try {
    await prisma.bitacoraClienteBufete.delete({
      where: { id },
    });
    return { success: true, message: 'Entrada de bitácora eliminada con éxito.' };
  } catch (error: any) {
    console.error('Error al eliminar entrada de bitácora:', error);
    if (error.code === 'P2025') { // Record to delete does not exist.
      return { success: false, message: 'Error: La entrada de bitácora que intenta eliminar no existe.' };
    }
    return { success: false, message: 'Error interno al eliminar la entrada de bitácora.' };
  }
}
