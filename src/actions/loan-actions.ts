
'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
// Corregir la importación de TipoGarantia y EstadoSolicitud: no usar 'type' para ellas si se usan como valores.
import { TipoGarantia, EstadoSolicitud } from '@prisma/client';
import type { ClientePrestamo as PrismaClientePrestamo, SolicitudPrestamo as PrismaSolicitudPrestamo, Documento as PrismaDocumento } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Esquema Zod para el formulario combinado de cliente de préstamo y su primera solicitud
// Coincide con LoanClientFormData en el componente de formulario
const loanClientAndFirstApplicationFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  lastName: z.string().min(2, "El apellido es requerido."),
  dni: z.string().regex(/^\d{8,13}$/, "DNI inválido (8-13 dígitos)."),
  phone: z.string().regex(/^\+?\d{8,15}$/, "Número de celular inválido."),
  email: z.string().email("Correo electrónico inválido."),
  workplace: z.string().min(2, "Lugar de trabajo requerido."),
  workplaceAddress: z.string().optional(),
  homeAddress: z.string().min(5, "Dirección de casa requerida."),
  loanAmount: z.coerce.number().positive("La cantidad debe ser positiva."),
  collateralType: z.nativeEnum(TipoGarantia, { required_error: "Seleccione un tipo de garantía." }),
  collateralDescription: z.string().optional(),
  rtn: z.string().optional().or(z.literal('')),
  loanDate: z.date({ required_error: "Fecha de solicitud requerida." }), // Esto será la fechaSolicitud
  paymentNotes: z.string().optional(), // Campo para notas sobre pagos o plan
  loanTermMonths: z.coerce.number().int().positive("El plazo debe ser un número positivo de meses.").optional(),
  interestRate: z.coerce.number().min(0, "La tasa no puede ser negativa.").optional(), // Permitir 0 si es necesario, pero usualmente >0
});

export type LoanClientAndFirstApplicationFormData = z.infer<typeof loanClientAndFirstApplicationFormSchema>;

// Tipos para Solicitudes Sanitizadas (Decimal a Number)
export type SanitizedSolicitudPrestamoNumeric = Omit<PrismaSolicitudPrestamo, 'montoSolicitado' | 'montoAprobado' | 'tasaInteresAnual' | 'documentos'> & {
  montoSolicitado: number;
  montoAprobado: number | null;
  tasaInteresAnual: number | null;
};
export type SanitizedSolicitudNumericWithDocs = Omit<PrismaSolicitudPrestamo, 'montoSolicitado' | 'montoAprobado' | 'tasaInteresAnual' | 'documentos'> & {
  montoSolicitado: number;
  montoAprobado: number | null;
  tasaInteresAnual: number | null;
  documentos: PrismaDocumento[]; // Asegura que documentos está aquí, aunque ya venía de PrismaSolicitudPrestamo
};

// Tipos para Clientes con Solicitudes Sanitizadas
export type SanitizedClientePrestamoWithSolicitudes = Omit<PrismaClientePrestamo, 'solicitudes'> & {
  solicitudes: SanitizedSolicitudNumericWithDocs[];
};


// Helper para convertir Decimal a Number en objetos SolicitudPrestamo
// Overload for when 'documentos' are definitely present
function convertSolicitudToNumeric(
  solicitud: PrismaSolicitudPrestamo & { documentos: PrismaDocumento[] }
): SanitizedSolicitudNumericWithDocs;
// Overload for when 'documentos' are not necessarily present (or not included in the select)
function convertSolicitudToNumeric(
  solicitud: PrismaSolicitudPrestamo
): SanitizedSolicitudPrestamoNumeric;
// Implementation
function convertSolicitudToNumeric(
  solicitud: (PrismaSolicitudPrestamo & { documentos?: PrismaDocumento[] }) | null | undefined
): SanitizedSolicitudPrestamoNumeric | SanitizedSolicitudNumericWithDocs | null | undefined {
  if (!solicitud) return solicitud;

  const commonConvertedPart = {
    ...solicitud, 
    montoSolicitado: Number(solicitud.montoSolicitado),
    montoAprobado: solicitud.montoAprobado !== null && solicitud.montoAprobado !== undefined ? Number(solicitud.montoAprobado) : null,
    tasaInteresAnual: solicitud.tasaInteresAnual !== null && solicitud.tasaInteresAnual !== undefined ? Number(solicitud.tasaInteresAnual) : null,
  };

  // Check if 'documentos' exists and is an array. If so, it's a SanitizedSolicitudNumericWithDocs.
  // The PrismaSolicitudPrestamo type definition might not always include 'documentos' unless explicitly selected.
  // However, when it is selected (as in listLoanClientsWithApplicationsAction), it will be there.
  if (solicitud.documentos && Array.isArray(solicitud.documentos)) {
    return {
      ...commonConvertedPart, // commonConvertedPart already spreads 'solicitud', which includes 'documentos' if present.
      documentos: solicitud.documentos, // Explicitly ensure 'documentos' is part of the returned object for type correctness.
    } as SanitizedSolicitudNumericWithDocs; // Cast to the more specific type that includes documentos.
  } else {
    // If 'documentos' is not present or not an array, it's just a SanitizedSolicitudPrestamoNumeric.
    // We must ensure 'documentos' field is not part of the output if it's not expected.
    // The SanitizedSolicitudPrestamoNumeric type (via Omit) does not include 'documentos'.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { documentos, ...rest } = commonConvertedPart; // Ensure 'documentos' is removed if it was optional and present
    return rest as SanitizedSolicitudPrestamoNumeric;
  }
}


// Acción para agregar un nuevo cliente de préstamo y su primera solicitud
export async function addLoanClientAndFirstApplicationAction(
  data: LoanClientAndFirstApplicationFormData
): Promise<{ success: boolean; cliente?: PrismaClientePrestamo; solicitud?: SanitizedSolicitudPrestamoNumeric; message: string; errors?: z.ZodIssue[] }> {
  const validatedFields = loanClientAndFirstApplicationFormSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Error de validación al agregar cliente y solicitud de préstamo:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Datos inválidos. Por favor, revise la información.",
      errors: validatedFields.error.issues,
    };
  }

  const {
    name, lastName, dni, phone, email, workplace, workplaceAddress, homeAddress, rtn,
    loanAmount, collateralType, collateralDescription, loanDate, paymentNotes, loanTermMonths, interestRate
  } = validatedFields.data;

  try {
    const nuevoCliente = await prisma.clientePrestamo.create({
      data: {
        nombres: name,
        apellidos: lastName,
        dni,
        telefono: phone,
        correoElectronico: email,
        lugarTrabajo: workplace,
        direccionTrabajo: workplaceAddress || null,
        direccionCasa: homeAddress,
        rtn: rtn || null,
      },
    });

    const nuevaSolicitudDb = await prisma.solicitudPrestamo.create({
      data: {
        clienteId: nuevoCliente.id,
        montoSolicitado: new Prisma.Decimal(loanAmount),
        tipoGarantia: collateralType, 
        descripcionGarantia: collateralDescription || null,
        fechaSolicitud: loanDate,
        estado: EstadoSolicitud.PENDIENTE_APROBACION, 
        notasDePago: paymentNotes || null,
        plazoMeses: loanTermMonths,
        tasaInteresAnual: interestRate !== undefined && interestRate !== null ? new Prisma.Decimal(interestRate) : null,
      },
    });

    return {
        success: true,
        cliente: nuevoCliente,
        solicitud: convertSolicitudToNumeric(nuevaSolicitudDb),
        message: 'Cliente y primera solicitud de préstamo agregados con éxito.'
    };
  } catch (error: any) {
    console.error('Error al agregar cliente de préstamo y solicitud:', error);
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('dni')) {
        return { success: false, message: 'Error: El DNI ya está registrado.' };
      }
      if (target?.includes('correoElectronico')) {
        return { success: false, message: 'Error: El correo electrónico ya está registrado.' };
      }
      if (target?.includes('rtn') && rtn) {
        return { success: false, message: 'Error: El RTN ya está registrado.' };
      }
    }
    return { success: false, message: 'Error interno al procesar la solicitud.' };
  }
}

// Acción para listar clientes de préstamo con sus solicitudes
export async function listLoanClientsWithApplicationsAction(): Promise<{
  success: boolean;
  clientesConSolicitudes?: SanitizedClientePrestamoWithSolicitudes[];
  message?: string;
}> {
  try {
    const clientesDb = await prisma.clientePrestamo.findMany({
      orderBy: {
        fechaRegistro: 'desc',
      },
      include: {
        solicitudes: { 
          orderBy: {
            fechaSolicitud: 'desc',
          },
          include: { 
            documentos: true, // documentos se incluye aquí, por lo tanto el tipo de cliente.solicitudes[n] será PrismaSolicitudPrestamo & { documentos: PrismaDocumento[] }
          }
        },
      },
    });

    const clientesConSolicitudesNumericas: SanitizedClientePrestamoWithSolicitudes[] = clientesDb.map(cliente => ({
      ...cliente,
      // Aquí, cada 'solicitudConDocs' será del tipo (PrismaSolicitudPrestamo & { documentos: PrismaDocumento[] })
      // El overload correcto de convertSolicitudToNumeric debería ser seleccionado, devolviendo SanitizedSolicitudNumericWithDocs
      solicitudes: cliente.solicitudes.map(solicitudConDocs => 
        convertSolicitudToNumeric(solicitudConDocs) 
      ),
    }));

    return { success: true, clientesConSolicitudes: clientesConSolicitudesNumericas };
  } catch (error) {
    console.error('Error al listar clientes de préstamo con solicitudes:', error);
    return { success: false, message: 'Error al cargar los datos de préstamos.' };
  }
}

// Acción para obtener un cliente de préstamo específico por ID con todas sus solicitudes
export async function getLoanClientWithApplicationsByIdAction(id: string): Promise<{
  success: boolean;
  clienteConSolicitudes?: SanitizedClientePrestamoWithSolicitudes; 
  message?: string;
}> {
  try {
    const clienteDb = await prisma.clientePrestamo.findUnique({
      where: { id },
      include: {
        solicitudes: { 
          orderBy: {
            fechaSolicitud: 'desc',
          },
           include: {
            documentos: true, // Igual que arriba, esto hace que 'documentos' esté presente.
          }
        },
      },
    });
    if (!clienteDb) {
      return { success: false, message: 'Cliente de préstamo no encontrado.' };
    }

    const clienteConSolicitudesNumericas: SanitizedClientePrestamoWithSolicitudes = {
        ...clienteDb,
        // 'solicitudConDocs' es (PrismaSolicitudPrestamo & { documentos: PrismaDocumento[] })
        // Debería usar el overload que devuelve SanitizedSolicitudNumericWithDocs
        solicitudes: clienteDb.solicitudes.map(solicitudConDocs => 
         convertSolicitudToNumeric(solicitudConDocs)
        ),
    };

    return { success: true, clienteConSolicitudes: clienteConSolicitudesNumericas };
  } catch (error) {
    console.error('Error al obtener cliente de préstamo por ID:', error);
    return { success: false, message: 'Error al cargar el cliente de préstamo.' };
  }
}


export async function updateLoanClientAndFirstApplicationAction(
  clienteId: string,
  data: Partial<LoanClientAndFirstApplicationFormData>
): Promise<{ success: boolean; cliente?: PrismaClientePrestamo; solicitud?: SanitizedSolicitudPrestamoNumeric; message: string; errors?: z.ZodIssue[] }> {

  const validatedFields = loanClientAndFirstApplicationFormSchema.partial().safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos inválidos para actualizar. Por favor, revise la información.",
      errors: validatedFields.error.issues,
    };
  }
  const updateData = validatedFields.data;

  try {
    const clienteActualizado = await prisma.clientePrestamo.update({
      where: { id: clienteId },
      data: {
        nombres: updateData.name,
        apellidos: updateData.lastName,
        dni: updateData.dni,
        telefono: updateData.phone,
        correoElectronico: updateData.email,
        lugarTrabajo: updateData.workplace,
        direccionTrabajo: updateData.workplaceAddress || null,
        direccionCasa: updateData.homeAddress,
        rtn: updateData.rtn || null,
      },
    });

    let solicitudDbActualizada: PrismaSolicitudPrestamo | undefined | null = null;
    if (updateData.loanAmount !== undefined || 
        updateData.collateralType !== undefined || 
        updateData.collateralDescription !== undefined ||
        updateData.loanDate !== undefined ||
        updateData.paymentNotes !== undefined ||
        updateData.loanTermMonths !== undefined ||
        updateData.interestRate !== undefined
      ) {
        const solicitudesExistentes = await prisma.solicitudPrestamo.findMany({
            where: { clienteId },
            orderBy: { fechaSolicitud: 'desc' }, 
            take: 1,
        });

        if (solicitudesExistentes.length > 0) {
            solicitudDbActualizada = await prisma.solicitudPrestamo.update({
                where: { id: solicitudesExistentes[0].id },
                data: {
                    montoSolicitado: updateData.loanAmount !== undefined ? new Prisma.Decimal(updateData.loanAmount) : undefined,
                    tipoGarantia: updateData.collateralType, 
                    descripcionGarantia: updateData.collateralDescription || null,
                    fechaSolicitud: updateData.loanDate,
                    notasDePago: updateData.paymentNotes || null,
                    plazoMeses: updateData.loanTermMonths,
                    tasaInteresAnual: updateData.interestRate !== undefined && updateData.interestRate !== null ? new Prisma.Decimal(updateData.interestRate) : null,
                },
            });
        } else if (updateData.loanAmount && updateData.collateralType && updateData.loanDate) { 
             solicitudDbActualizada = await prisma.solicitudPrestamo.create({
                data: {
                    clienteId: clienteId,
                    montoSolicitado: new Prisma.Decimal(updateData.loanAmount!), 
                    tipoGarantia: updateData.collateralType,
                    descripcionGarantia: updateData.collateralDescription || null,
                    fechaSolicitud: updateData.loanDate!, 
                    estado: EstadoSolicitud.PENDIENTE_APROBACION,
                    notasDePago: updateData.paymentNotes || null,
                    plazoMeses: updateData.loanTermMonths,
                    tasaInteresAnual: updateData.interestRate !== undefined && updateData.interestRate !== null ? new Prisma.Decimal(updateData.interestRate) : null,
                },
            });
        }
    }

    return {
        success: true,
        cliente: clienteActualizado,
        solicitud: solicitudDbActualizada ? convertSolicitudToNumeric(solicitudDbActualizada) : undefined,
        message: 'Cliente de préstamo y/o solicitud actualizados con éxito.'
    };
  } catch (error: any) {
    console.error('Error al actualizar cliente de préstamo:', error);
    if (error.code === 'P2025') {
      return { success: false, message: 'Error: El cliente de préstamo que intenta actualizar no existe.' };
    }
     if (error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('dni')) {
        return { success: false, message: 'Error: El DNI ya está registrado para otro cliente.' };
      }
      if (target?.includes('correoElectronico')) {
        return { success: false, message: 'Error: El correo electrónico ya está registrado para otro cliente.' };
      }
      if (target?.includes('rtn') && updateData.rtn) {
        return { success: false, message: 'Error: El RTN ya está registrado para otro cliente.' };
      }
    }
    return { success: false, message: 'Error interno al actualizar el cliente de préstamo.' };
  }
}

export async function deleteLoanClientAction(id: string): Promise<{ success: boolean; message: string }> {
  try {
     // Primero eliminar documentos asociados a las solicitudes de este cliente
    const solicitudes = await prisma.solicitudPrestamo.findMany({
      where: { clienteId: id },
      select: { id: true }
    });
    const solicitudIds = solicitudes.map(s => s.id);
    if (solicitudIds.length > 0) {
      await prisma.documento.deleteMany({
        where: { solicitudPrestamoId: { in: solicitudIds } }
      });
    }
    // Luego eliminar pagos asociados
    if (solicitudIds.length > 0) {
      await prisma.pagoPrestamo.deleteMany({
        where: { solicitudPrestamoId: { in: solicitudIds } }
      });
    }
    // Luego eliminar las solicitudes
    await prisma.solicitudPrestamo.deleteMany({
        where: { clienteId: id }
    }); 
    // Finalmente eliminar el cliente
    await prisma.clientePrestamo.delete({
      where: { id },
    });
    return { success: true, message: 'Cliente de préstamo, sus solicitudes, documentos y pagos asociados eliminados con éxito.' };
  } catch (error: any) {
    console.error('Error al eliminar cliente de préstamo:', error);
    if (error.code === 'P2025') { 
      return { success: false, message: 'Error: El cliente de préstamo que intenta eliminar no existe o una entidad relacionada no fue encontrada.' };
    }
    // P2003 (foreign key constraint) should ideally be handled by deleting dependents first as done above
    if (error.code === 'P2003') { 
        return { success: false, message: 'Error: No se puede eliminar el cliente porque tiene otros registros asociados que no se pudieron eliminar. Revise las dependencias (esto no debería ocurrir si la lógica de eliminación de dependencias es correcta).'};
    }
    return { success: false, message: 'Error interno al eliminar el cliente de préstamo.' };
  }
}
    

    