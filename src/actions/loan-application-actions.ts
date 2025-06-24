
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { EstadoSolicitud, type SolicitudPrestamo as PrismaSolicitudPrestamo, type Documento as PrismaDocumento, type ClientePrestamo as PrismaClientePrestamo } from '@prisma/client';

// Helper NO EXPORTADO para convertir una solicitud con Decimals a una con numbers
// y para asegurar que contenidoArchivo no se envíe al cliente.
function sanitizeFullSolicitudPrestamo<
  T extends (PrismaSolicitudPrestamo & { documentos?: Omit<PrismaDocumento, 'contenidoArchivo'>[], cliente?: PrismaClientePrestamo }) | null | undefined
>(solicitud: T): T {
  if (!solicitud) return solicitud;

  // Clonar el objeto para evitar mutaciones directas y asegurar que no se propaguen datos no deseados
  const sanitized: any = { ...solicitud };

  if (sanitized.montoSolicitado !== null && sanitized.montoSolicitado !== undefined) {
    sanitized.montoSolicitado = Number(sanitized.montoSolicitado);
  }
  if (sanitized.montoAprobado !== null && sanitized.montoAprobado !== undefined) {
    sanitized.montoAprobado = Number(sanitized.montoAprobado);
  }
  if (sanitized.tasaInteresAnual !== null && sanitized.tasaInteresAnual !== undefined) {
    sanitized.tasaInteresAnual = Number(sanitized.tasaInteresAnual);
  }
  
  // Asegurarse de que los documentos no incluyan el contenido del archivo (si por alguna razón se colara)
  if (sanitized.documentos && Array.isArray(sanitized.documentos)) {
    sanitized.documentos = sanitized.documentos.map((doc: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contenidoArchivo, ...restOfDoc } = doc; // Destructurar para excluir contenidoArchivo
      return restOfDoc;
    });
  }

  return sanitized as T;
}


const updateStatusSchema = z.object({
  solicitudId: z.string().cuid(),
  nuevoEstado: z.nativeEnum(EstadoSolicitud),
});

export async function updateLoanApplicationStatusAction(
  data: z.infer<typeof updateStatusSchema>
): Promise<{ success: boolean; solicitud?: Omit<PrismaSolicitudPrestamo, 'contenidoArchivo'> & { documentos?: Omit<PrismaDocumento, 'contenidoArchivo'>[] }; message: string; errors?: z.ZodIssue[] }> {
  const validatedFields = updateStatusSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos inválidos para actualizar estado.",
      errors: validatedFields.error.issues,
    };
  }

  const { solicitudId, nuevoEstado } = validatedFields.data;

  try {
    const solicitudActualizada = await prisma.solicitudPrestamo.update({
      where: { id: solicitudId },
      data: { 
        estado: nuevoEstado,
        ...(nuevoEstado === EstadoSolicitud.APROBADO && { fechaAprobacion: new Date() }),
        ...(nuevoEstado === EstadoSolicitud.DESEMBOLSADO && { fechaDesembolso: new Date() }),
       },
      include: { 
        documentos: {
          select: { // Seleccionar explícitamente los campos, omitiendo contenidoArchivo
            id: true,
            nombreDocumento: true,
            tipoDocumento: true,
            urlDocumento: true,
            tamanoBytes: true,
            fechaSubida: true,
            descripcion: true,
            solicitudPrestamoId: true,
          }
        } 
      }
    });
    return { 
        success: true, 
        solicitud: sanitizeFullSolicitudPrestamo(solicitudActualizada) as (Omit<PrismaSolicitudPrestamo, 'contenidoArchivo'> & { documentos?: Omit<PrismaDocumento, 'contenidoArchivo'>[] }), 
        message: `Estado de la solicitud actualizado a ${nuevoEstado.replace(/_/g, ' ')}.` 
    };
  } catch (error: any) {
    console.error('Error al actualizar estado de la solicitud:', error);
    if (error.code === 'P2025') {
      return { success: false, message: 'Error: La solicitud que intenta actualizar no existe.' };
    }
    return { success: false, message: 'Error interno al actualizar el estado de la solicitud.' };
  }
}


export async function getLoanApplicationByIdAction(solicitudId: string): Promise<{
  success: boolean;
  solicitud?: Omit<PrismaSolicitudPrestamo, 'contenidoArchivo'> & { documentos: Omit<PrismaDocumento, 'contenidoArchivo'>[], cliente: PrismaClientePrestamo };
  message?: string;
}> {
  if (!solicitudId) {
    return { success: false, message: 'ID de solicitud no proporcionado.' };
  }
  try {
    const solicitud = await prisma.solicitudPrestamo.findUnique({
      where: { id: solicitudId },
      include: {
        documentos: {
           select: { // Omitir contenidoArchivo
            id: true,
            nombreDocumento: true,
            tipoDocumento: true,
            urlDocumento: true,
            tamanoBytes: true,
            fechaSubida: true,
            descripcion: true,
            solicitudPrestamoId: true,
          }
        },
        cliente: true, 
      },
    });

    if (!solicitud) {
      return { success: false, message: 'Solicitud de préstamo no encontrada.' };
    }
    
    return { success: true, solicitud: sanitizeFullSolicitudPrestamo(solicitud) as (Omit<PrismaSolicitudPrestamo, 'contenidoArchivo'> & { documentos: Omit<PrismaDocumento, 'contenidoArchivo'>[], cliente: PrismaClientePrestamo }) };
  } catch (error) {
    console.error('Error al obtener solicitud por ID:', error);
    return { success: false, message: 'Error al cargar la solicitud de préstamo.' };
  }
}


const MAX_FILE_SIZE_MB = 5; 
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];


export async function uploadLoanDocumentAction(
  formData: FormData
): Promise<{ success: boolean; documento?: Omit<PrismaDocumento, 'contenidoArchivo'>; message: string; errors?: any }> {
  
  const solicitudPrestamoId = formData.get('solicitudPrestamoId') as string;
  const file = formData.get('file') as File | null;

  if (!solicitudPrestamoId) {
    return { success: false, message: "ID de solicitud de préstamo es requerido." };
  }
  if (!file) {
    return { success: false, message: "Archivo es requerido." };
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { success: false, message: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB.` };
  }
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return { success: false, message: `Tipo de archivo no soportado. Permitidos: PDF, JPG, PNG, WEBP.` };
  }

  // Simulación de subida a almacenamiento en la nube y obtención de URL
  // TODO: Reemplazar esto con la lógica real de subida a Firebase Storage, S3, etc.
  const simulatedFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  // En una implementación real, esta URL vendría del servicio de almacenamiento.
  const simulatedFileUrl = `/uploads/prestamos/${solicitudPrestamoId}/${simulatedFileName}`; 

  try {
    const documentoGuardado = await prisma.documento.create({
      data: {
        solicitudPrestamoId: solicitudPrestamoId,
        nombreDocumento: file.name,
        urlDocumento: simulatedFileUrl, // Guardar la URL (real o simulada)
        tipoDocumento: file.type,
        tamanoBytes: file.size,
        // Ya no guardamos contenidoArchivo, esta línea es un recordatorio.
      },
      select: { // Seleccionar explícitamente los campos para la respuesta
        id: true,
        nombreDocumento: true,
        tipoDocumento: true,
        urlDocumento: true,
        tamanoBytes: true,
        fechaSubida: true,
        descripcion: true,
        solicitudPrestamoId: true,
      }
    });
    // Mensaje de consola mejorado para reflejar la simulación
    console.warn(`SIMULACIÓN ACTIVA (uploadLoanDocumentAction): El archivo '${file.name}' NO se ha subido a ningún almacenamiento físico. Solo se ha creado un registro en la base de datos con la URL simulada: '${simulatedFileUrl}'.`);
    return { success: true, documento: documentoGuardado, message: `Documento '${file.name}' registrado con URL simulada.` };

  } catch (error: any) {
    console.error('Error al guardar referencia del documento:', error);
    return { success: false, message: 'Error interno al guardar la información del documento.' };
  }
}

export async function listDocumentsForApplicationAction(solicitudId: string): Promise<{
  success: boolean;
  documentos?: Omit<PrismaDocumento, 'contenidoArchivo'>[];
  message?: string;
}> {
  if (!solicitudId) {
    return { success: false, message: "ID de solicitud no proporcionado." };
  }
  try {
    const documentos = await prisma.documento.findMany({
      where: { solicitudPrestamoId: solicitudId },
      orderBy: { fechaSubida: 'desc' },
      select: { // Omitir contenidoArchivo
        id: true,
        nombreDocumento: true,
        tipoDocumento: true,
        urlDocumento: true,
        tamanoBytes: true,
        fechaSubida: true,
        descripcion: true,
        solicitudPrestamoId: true,
      }
    });
    return { success: true, documentos };
  } catch (error) {
    console.error('Error al listar documentos:', error);
    return { success: false, message: 'Error al cargar los documentos de la solicitud.' };
  }
}

export async function deleteLoanDocumentAction(documentoId: string): Promise<{
  success: boolean;
  message: string;
}> {
   if (!documentoId) {
    return { success: false, message: "ID de documento no proporcionado." };
  }
  try {
    // TODO: Si los archivos estuvieran en almacenamiento en la nube real, aquí también se eliminarían de allí.
    const documentoEliminado = await prisma.documento.findUnique({ where: {id: documentoId }});

    if (documentoEliminado) {
        await prisma.documento.delete({
            where: { id: documentoId },
        });
        // Mensaje de consola mejorado para reflejar la simulación
        console.warn(`SIMULACIÓN ACTIVA (deleteLoanDocumentAction): El registro del documento '${documentoEliminado.nombreDocumento}' (ID: ${documentoId}) se ha eliminado de la BD. NO se ha eliminado ningún archivo de almacenamiento físico (ya que la subida es simulada).`);
        return { success: true, message: "Registro del documento eliminado de la BD con éxito." };
    } else {
        return { success: false, message: 'Error: El documento que intenta eliminar no existe en la BD.' };
    }

  } catch (error: any) {
    console.error('Error al eliminar el registro del documento:', error);
    if (error.code === 'P2025') { // Aunque ya lo manejamos arriba, es una doble seguridad.
        return { success: false, message: 'Error: El documento que intenta eliminar no existe.' };
    }
    return { success: false, message: 'Error interno al eliminar el registro del documento.' };
  }
}
    
    
    

