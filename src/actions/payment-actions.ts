
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { EstadoSolicitud, Prisma, type PagoPrestamo as PrismaPagoPrestamo, type SolicitudPrestamo as PrismaSolicitudPrestamo } from '@prisma/client';

// Esquema Zod para registrar un nuevo pago
const registrarPagoSchema = z.object({
  solicitudPrestamoId: z.string().cuid({ message: "ID de solicitud de préstamo inválido." }),
  montoPagado: z.coerce.number().positive({ message: "El monto pagado debe ser un número positivo." }),
  fechaPago: z.date({ required_error: "La fecha de pago es requerida." }),
  metodoPago: z.string().optional(),
  referenciaPago: z.string().optional(),
  notas: z.string().optional(),
});
export type RegistrarPagoData = z.infer<typeof registrarPagoSchema>;

// Esquema Zod para actualizar un pago existente
const actualizarPagoSchema = z.object({
  montoPagado: z.coerce.number().positive({ message: "El monto pagado debe ser un número positivo." }).optional(),
  fechaPago: z.date().optional(),
  metodoPago: z.string().nullable().optional(),
  referenciaPago: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
});
export type ActualizarPagoData = z.infer<typeof actualizarPagoSchema>;

// Tipo para el pago con montoPagado como número (para el cliente)
type SanitizedPagoPrestamo = Omit<PrismaPagoPrestamo, 'montoPagado'> & { montoPagado: number };

// Helper para convertir Decimal a number en un objeto PagoPrestamo para enviar al cliente
function sanitizePagoPrestamo(pago: PrismaPagoPrestamo): SanitizedPagoPrestamo {
  return {
    ...pago,
    montoPagado: Number(pago.montoPagado), // Convert Decimal to number
  };
}

async function actualizarEstadoSolicitudTrasPago(solicitudId: string): Promise<void> {
    const solicitud = await prisma.solicitudPrestamo.findUnique({
      where: { id: solicitudId },
      include: { pagos: true }
    });

    if (!solicitud) return;

    const todosLosPagos = solicitud.pagos.map(p => ({...p, montoPagado: Number(p.montoPagado)})); // Convert Decimal to number for calculation
    const totalPagado = todosLosPagos.reduce((sum, p) => sum + p.montoPagado, 0);
    
    let montoBaseCalculo = Number(solicitud.montoAprobado);
    if (isNaN(montoBaseCalculo) || montoBaseCalculo <= 0) {
        montoBaseCalculo = Number(solicitud.montoSolicitado);
    }
    if (isNaN(montoBaseCalculo) || montoBaseCalculo <= 0) {
        console.warn(`La solicitud ${solicitudId} no tiene un monto base válido para calcular el estado de pago.`);
        return;
    }

    let nuevoEstadoSolicitud = solicitud.estado;
    const enPagoTransitionStates: EstadoSolicitud[] = [EstadoSolicitud.DESEMBOLSADO, EstadoSolicitud.APROBADO, EstadoSolicitud.PAGADO_COMPLETAMENTE, EstadoSolicitud.EN_PAGO, EstadoSolicitud.INCUMPLIMIENTO];
    const noChangeStates: EstadoSolicitud[] = [EstadoSolicitud.PENDIENTE_APROBACION, EstadoSolicitud.RECHAZADO, EstadoSolicitud.CANCELADO];


    if (totalPagado >= montoBaseCalculo) {
      nuevoEstadoSolicitud = EstadoSolicitud.PAGADO_COMPLETAMENTE;
    } else if (totalPagado > 0) {
        if (enPagoTransitionStates.includes(solicitud.estado)) {
           nuevoEstadoSolicitud = EstadoSolicitud.EN_PAGO;
        }
    } else { 
        // Si no hay pagos, revertir a un estado anterior si es lógico
        if (solicitud.fechaDesembolso) {
            nuevoEstadoSolicitud = EstadoSolicitud.DESEMBOLSADO;
        } else if (solicitud.fechaAprobacion) {
            nuevoEstadoSolicitud = EstadoSolicitud.APROBADO;
        } else {
            // Solo cambiar a PENDIENTE_APROBACION si no estaba en un estado final como RECHAZADO o CANCELADO
            if (!noChangeStates.includes(solicitud.estado)) {
                 nuevoEstadoSolicitud = EstadoSolicitud.PENDIENTE_APROBACION;
            }
        }
    }
    
    if (nuevoEstadoSolicitud !== solicitud.estado) {
      await prisma.solicitudPrestamo.update({
        where: { id: solicitud.id },
        data: { estado: nuevoEstadoSolicitud },
      });
    }
}

export async function registrarPagoAccion(
  data: RegistrarPagoData
): Promise<{ success: boolean; pago?: SanitizedPagoPrestamo; message: string; errors?: z.ZodIssue[] }> {
  const validatedFields = registrarPagoSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos inválidos para registrar el pago.",
      errors: validatedFields.error.issues,
    };
  }

  try {
    const solicitud = await prisma.solicitudPrestamo.findUnique({
      where: { id: validatedFields.data.solicitudPrestamoId },
    });

    if (!solicitud) {
      return { success: false, message: "Error: La solicitud de préstamo asociada no existe." };
    }

    // Definir explícitamente el tipo del array para la comprobación
    const estadosPermitidosParaPago: EstadoSolicitud[] = [
      EstadoSolicitud.APROBADO, 
      EstadoSolicitud.DESEMBOLSADO, 
      EstadoSolicitud.EN_PAGO, 
      EstadoSolicitud.PAGADO_COMPLETAMENTE, 
      EstadoSolicitud.INCUMPLIMIENTO
    ];

    // No permitir registrar pagos si la solicitud no está en un estado adecuado
    if (!estadosPermitidosParaPago.includes(solicitud.estado)) {
      return { success: false, message: `No se pueden registrar pagos para solicitudes en estado: ${solicitud.estado.replace(/_/g, ' ')}.` };
    }

    const nuevoPago = await prisma.pagoPrestamo.create({
      data: {
        solicitudPrestamoId: validatedFields.data.solicitudPrestamoId,
        montoPagado: new Prisma.Decimal(validatedFields.data.montoPagado), // Convert number to Prisma.Decimal
        fechaPago: validatedFields.data.fechaPago,
        metodoPago: validatedFields.data.metodoPago || null,
        referenciaPago: validatedFields.data.referenciaPago || null,
        notas: validatedFields.data.notas || null,
      },
    });

    await actualizarEstadoSolicitudTrasPago(validatedFields.data.solicitudPrestamoId);

    return { success: true, pago: sanitizePagoPrestamo(nuevoPago), message: 'Pago registrado con éxito y estado de solicitud actualizado si es necesario.' };
  } catch (error: any) {
    console.error('Error al registrar el pago:', error);
    return { success: false, message: 'Error interno al registrar el pago.' };
  }
}

export async function actualizarPagoAccion(
  pagoId: string,
  data: ActualizarPagoData
): Promise<{ success: boolean; pago?: SanitizedPagoPrestamo; message: string; errors?: z.ZodIssue[] }> {
  const validatedFields = actualizarPagoSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos inválidos para actualizar el pago.",
      errors: validatedFields.error.issues,
    };
  }
  if (Object.keys(validatedFields.data).length === 0) {
    return { success: true, message: "No se proporcionaron datos para actualizar. No se realizaron cambios." };
  }

  try {
    const pagoExistente = await prisma.pagoPrestamo.findUnique({
        where: {id: pagoId}
    });
    if (!pagoExistente) {
        return { success: false, message: "Error: El pago que intenta actualizar no existe." };
    }
    
    const dataToUpdate: Partial<Omit<PrismaPagoPrestamo, 'id' | 'solicitudPrestamoId' | 'fechaRegistro'>> & { montoPagado?: Prisma.Decimal } = {};

    if (validatedFields.data.montoPagado !== undefined) {
      dataToUpdate.montoPagado = new Prisma.Decimal(validatedFields.data.montoPagado); // Convert number to Prisma.Decimal
    }
    if (validatedFields.data.fechaPago !== undefined) dataToUpdate.fechaPago = validatedFields.data.fechaPago;
    if (validatedFields.data.metodoPago !== undefined) dataToUpdate.metodoPago = validatedFields.data.metodoPago;
    if (validatedFields.data.referenciaPago !== undefined) dataToUpdate.referenciaPago = validatedFields.data.referenciaPago;
    if (validatedFields.data.notas !== undefined) dataToUpdate.notas = validatedFields.data.notas;

    const pagoActualizado = await prisma.pagoPrestamo.update({
      where: { id: pagoId },
      data: dataToUpdate,
    });

    await actualizarEstadoSolicitudTrasPago(pagoActualizado.solicitudPrestamoId);

    return { success: true, pago: sanitizePagoPrestamo(pagoActualizado), message: 'Pago actualizado con éxito y estado de solicitud actualizado si es necesario.' };
  } catch (error: any) {
    console.error('Error al actualizar el pago:', error);
    if (error.code === 'P2025') {
      return { success: false, message: 'Error: El pago que intenta actualizar no existe.' };
    }
    return { success: false, message: 'Error interno al actualizar el pago.' };
  }
}


export async function listarPagosPorSolicitudAccion(
  solicitudPrestamoId: string
): Promise<{
  success: boolean;
  pagos?: SanitizedPagoPrestamo[];
  message?: string;
}> {
  if (!solicitudPrestamoId) {
    return { success: false, message: 'ID de solicitud de préstamo no proporcionado.' };
  }

  try {
    const pagosDb = await prisma.pagoPrestamo.findMany({
      where: {
        solicitudPrestamoId: solicitudPrestamoId,
      },
      orderBy: {
        fechaPago: 'desc', 
      },
    });
    return { success: true, pagos: pagosDb.map(sanitizePagoPrestamo) };
  } catch (error) {
    console.error('Error al listar los pagos de la solicitud:', error);
    return { success: false, message: 'Error al cargar los pagos.' };
  }
}

export async function eliminarPagoAccion(
  pagoId: string
): Promise<{ success: boolean; message: string }> {
  if (!pagoId) {
    return { success: false, message: 'ID de pago no proporcionado.' };
  }
  try {
    const pagoAEliminar = await prisma.pagoPrestamo.findUnique({
      where: { id: pagoId },
      select: { solicitudPrestamoId: true }
    });

    if (!pagoAEliminar) {
      return { success: false, message: 'Error: El pago que intenta eliminar no existe.' };
    }
    
    const { solicitudPrestamoId } = pagoAEliminar;

    await prisma.pagoPrestamo.delete({
      where: { id: pagoId },
    });

    await actualizarEstadoSolicitudTrasPago(solicitudPrestamoId);

    return { success: true, message: 'Pago eliminado con éxito y estado de solicitud actualizado si es necesario.' };
  } catch (error: any) {
    console.error('Error al eliminar el pago:', error);
    if (error.code === 'P2025') {
      return { success: false, message: 'Error: El pago que intenta eliminar no existe o una entidad relacionada no fue encontrada.' };
    }
    return { success: false, message: 'Error interno al eliminar el pago.' };
  }
}

   