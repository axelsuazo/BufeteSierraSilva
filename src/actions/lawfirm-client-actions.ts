'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import type { ClienteBufete as PrismaClienteBufete, BitacoraClienteBufete } from '@prisma/client';
import nodemailer from 'nodemailer';
import { ADMIN_EMAIL_ADDRESS } from '@/lib/constants';

// Esquema Zod para la validación de la entrada al agregar/editar
const lawFirmClientFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  phone: z.string().regex(/^\+?\d{8,15}$/, { message: 'Número de celular inválido.' }).optional().or(z.literal('')),
  dni: z.string().regex(/^\d{8,13}$/, { message: 'DNI inválido (debe tener entre 8 y 13 dígitos).' }).optional().or(z.literal('')),
  workplace: z.string().optional().or(z.literal('')),
  caseType: z.string().min(1, { message: 'Debe seleccionar un tipo de proceso/asunto.' }),
  message: z.string().min(10, { message: 'Si ingresa un mensaje, debe tener al menos 10 caracteres.' }).optional().or(z.literal('')), // Campo de mensaje añadido
});

export type LawFirmClientFormData = z.infer<typeof lawFirmClientFormSchema>;

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

async function sendClientConfirmationEmail(clientEmail: string, clientName: string): Promise<{ success: boolean; message: string }> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Credenciales de email no configuradas. Omitiendo envío de correo de confirmación de cliente.');
    return { success: false, message: "Servicio de correo no configurado. No se pudo enviar el correo de confirmación al cliente." };
  }

  const mailOptions = {
    from: `"Sierra Silva - Servicios Legales" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `Confirmación de Registro/Consulta - Sierra Silva`,
    html: `
      <h1>¡Gracias por contactar a Sierra Silva, ${clientName}!</h1>
      <p>Hemos recibido su información y/o consulta.</p>
      <p>Un miembro de nuestro equipo se pondrá en contacto con usted pronto si es necesario, o para dar seguimiento a su caso/consulta.</p>
      <p>Si tiene alguna pregunta inmediata, no dude en contactarnos a través de nuestro sitio web.</p>
      <hr>
      <p>Atentamente,</p>
      <p>El equipo de Sierra Silva</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo de confirmación/consulta enviado a ${clientEmail} para ${clientName}.`);
    return { success: true, message: "Correo de confirmación/consulta enviado al cliente." };
  } catch (error) {
    console.error(`Error enviando correo de confirmación/consulta a ${clientEmail}:`, error);
    return { success: false, message: "Error al enviar el correo de confirmación/consulta al cliente." };
  }
}

async function sendAdminNotificationEmail(clientData: LawFirmClientFormData & { estado: string }): Promise<{ success: boolean; message: string }> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Credenciales de email no configuradas. Omitiendo envío de correo de notificación al administrador.');
    return { success: false, message: "Servicio de correo no configurado. No se pudo enviar la notificación al administrador." };
  }

  const mailOptions = {
    from: `"Notificaciones Web Sierra Silva" <${process.env.EMAIL_USER}>`,
    to: ADMIN_EMAIL_ADDRESS,
    replyTo: clientData.email,
    subject: `Nuevo Cliente/Consulta Registrado: ${clientData.name} ${clientData.lastName}`,
    html: `
      <h1>Nuevo Cliente/Consulta Registrado desde el Sitio Web</h1>
      <p>Un nuevo cliente potencial o consulta se ha registrado a través del formulario del sitio web:</p>
      <ul>
        <li><strong>Nombre:</strong> ${clientData.name}</li>
        <li><strong>Apellido:</strong> ${clientData.lastName}</li>
        <li><strong>Correo Electrónico:</strong> ${clientData.email}</li>
        <li><strong>Teléfono:</strong> ${clientData.phone || 'No proporcionado'}</li>
        <li><strong>DNI:</strong> ${clientData.dni || 'No proporcionado'}</li>
        <li><strong>Lugar de Trabajo:</strong> ${clientData.workplace || 'No proporcionado'}</li>
        <li><strong>Tipo de Caso/Asunto:</strong> ${clientData.caseType}</li>
        <li><strong>Estado Inicial:</strong> ${clientData.estado}</li>
      </ul>
      ${clientData.message ? `
      <h2>Mensaje Adicional:</h2>
      <p style="white-space: pre-wrap;">${clientData.message}</p>
      ` : ''}
      <hr>
      <p>Puedes responder directamente a este correo para contactar a ${clientData.name} (${clientData.email}) o gestionar el cliente en el panel de administración.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email de notificación de nuevo cliente/consulta enviado a:', ADMIN_EMAIL_ADDRESS);
    return { success: true, message: "Notificación de nuevo cliente/consulta enviada al administrador." };
  } catch (error) {
    console.error('Error enviando email de notificación de nuevo cliente/consulta:', error);
    return { success: false, message: "Error al enviar notificación por email al administrador." };
  }
}


export async function agregarClienteBufeteAccion(
  data: LawFirmClientFormData
): Promise<{ success: boolean; cliente?: PrismaClienteBufete; message: string; errors?: z.ZodIssue[] }> {
  const validatedFields = lawFirmClientFormSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Error de validación al agregar cliente bufete:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Datos inválidos. Por favor, revise la información.",
      errors: validatedFields.error.issues,
    };
  }

  const estadoInicial = 'Consulta'; 

  try {
    const nuevoCliente = await prisma.clienteBufete.create({
      data: {
        nombres: validatedFields.data.name,
        apellidos: validatedFields.data.lastName,
        correoElectronico: validatedFields.data.email,
        telefono: validatedFields.data.phone || null,
        dni: validatedFields.data.dni || null,
        lugarTrabajo: validatedFields.data.workplace || null,
        tipoCaso: validatedFields.data.caseType,
        estado: estadoInicial, 
      },
    });

    let messageCliente = 'Cliente/Consulta registrado con éxito. ';
    let messageAdmin = '';
    let messageBitacora = '';

    // Si hay un mensaje, guardarlo en la bitácora
    if (validatedFields.data.message && validatedFields.data.message.trim() !== '') {
      try {
        await prisma.bitacoraClienteBufete.create({
          data: {
            clienteId: nuevoCliente.id,
            descripcion: validatedFields.data.message,
            tipoActuacion: "Consulta Inicial desde Formulario Web",
          },
        });
        messageBitacora = 'Mensaje guardado en bitácora. ';
      } catch (logError) {
        console.error("Error al guardar mensaje en bitácora:", logError);
        messageBitacora = 'Error al guardar mensaje en bitácora. ';
      }
    }

    // Enviar correo de confirmación al cliente
    if (nuevoCliente.correoElectronico) {
        const clientEmailResult = await sendClientConfirmationEmail(nuevoCliente.correoElectronico, `${nuevoCliente.nombres} ${nuevoCliente.apellidos}`);
        messageCliente += clientEmailResult.message;
    }

    // Enviar notificación al administrador
    const adminNotificationResult = await sendAdminNotificationEmail({ ...validatedFields.data, estado: estadoInicial });
    messageAdmin = adminNotificationResult.message;

    return { success: true, cliente: nuevoCliente, message: `${messageCliente} ${messageBitacora} ${messageAdmin}`.trim() };
  } catch (error: any) {
    console.error('Error al agregar cliente del bufete:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('correoElectronico')) {
      return { success: false, message: 'Error: El correo electrónico ya está registrado.' };
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('dni')) {
      return { success: false, message: 'Error: El DNI ya está registrado.' };
    }
    return { success: false, message: 'Error interno al agregar el cliente/consulta.' };
  }
}

export async function listarClientesBufeteAccion(): Promise<{
  success: boolean;
  clientes?: PrismaClienteBufete[];
  message?: string;
}> {
  try {
    const clientes = await prisma.clienteBufete.findMany({
      orderBy: {
        fechaRegistro: 'desc',
      },
    });
    return { success: true, clientes };
  } catch (error) {
    console.error('Error al listar clientes del bufete:', error);
    return { success: false, message: 'Error al cargar los clientes del bufete.' };
  }
}

// Extender el esquema para actualización, el mensaje no se actualiza directamente aquí
// Se actualiza a través de la bitácora.
const updateClientFormSchema = lawFirmClientFormSchema.omit({ message: true }).extend({ 
    estado: z.string().optional(), 
});

export async function actualizarClienteBufeteAccion(
  id: string,
  data: Partial<z.infer<typeof updateClientFormSchema>> 
): Promise<{ success: boolean; cliente?: PrismaClienteBufete; message: string; errors?: z.ZodIssue[] }> {
  // Validar sin el campo 'message'
  const { message, ...dataWithoutMessage } = data as LawFirmClientFormData; 
  const validatedFields = updateClientFormSchema.partial().safeParse(dataWithoutMessage); 

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos inválidos para actualizar. Por favor, revise la información.",
      errors: validatedFields.error.issues,
    };
  }
  
  const updateData: any = {};
  if (validatedFields.data.name !== undefined) updateData.nombres = validatedFields.data.name;
  if (validatedFields.data.lastName !== undefined) updateData.apellidos = validatedFields.data.lastName;
  if (validatedFields.data.email !== undefined) updateData.correoElectronico = validatedFields.data.email;
  if (validatedFields.data.phone !== undefined) updateData.telefono = validatedFields.data.phone || null;
  if (validatedFields.data.dni !== undefined) updateData.dni = validatedFields.data.dni || null;
  if (validatedFields.data.workplace !== undefined) updateData.lugarTrabajo = validatedFields.data.workplace || null;
  if (validatedFields.data.caseType !== undefined) updateData.tipoCaso = validatedFields.data.caseType;
  if (validatedFields.data.estado !== undefined) updateData.estado = validatedFields.data.estado;


  if (Object.keys(updateData).length === 0) {
    return { success: false, message: "No se proporcionaron datos para actualizar." };
  }


  try {
    const clienteActualizado = await prisma.clienteBufete.update({
      where: { id },
      data: updateData,
    });
    return { success: true, cliente: clienteActualizado, message: 'Cliente actualizado con éxito.' };
  } catch (error: any) {
    console.error('Error al actualizar cliente del bufete:', error);
    if (error.code === 'P2025') {
      return { success: false, message: 'Error: El cliente que intenta actualizar no existe.' };
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('correoElectronico')) {
      return { success: false, message: 'Error: El correo electrónico ya está registrado por otro cliente.' };
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('dni')) {
      return { success: false, message: 'Error: El DNI ya está registrado por otro cliente.' };
    }
    return { success: false, message: 'Error interno al actualizar el cliente.' };
  }
}

export async function actualizarEstadoClienteBufeteAccion(
  clienteId: string,
  nuevoEstado: string
): Promise<{ success: boolean; cliente?: PrismaClienteBufete; message: string }> {
  if (!clienteId || !nuevoEstado) {
    return { success: false, message: 'ID de cliente o nuevo estado no proporcionado.' };
  }

  const estadosPermitidos = ["Consulta", "Activo", "Pendiente", "Finalizado", "Archivado"];
  if (!estadosPermitidos.includes(nuevoEstado)) {
    return { success: false, message: `Estado '${nuevoEstado}' no es válido.` };
  }

  try {
    const clienteActualizado = await prisma.clienteBufete.update({
      where: { id: clienteId },
      data: { estado: nuevoEstado },
    });
    return { success: true, cliente: clienteActualizado, message: `Estado del cliente actualizado a '${nuevoEstado}'.` };
  } catch (error: any) {
    console.error('Error al actualizar estado del cliente:', error);
    if (error.code === 'P2025') { 
      return { success: false, message: 'Error: El cliente que intenta actualizar no existe.' };
    }
    return { success: false, message: 'Error interno al actualizar el estado del cliente.' };
  }
}


export async function eliminarClienteBufeteAccion(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Primero eliminar bitácoras asociadas para evitar error de clave foránea
    await prisma.bitacoraClienteBufete.deleteMany({
      where: { clienteId: id },
    });
    // Luego eliminar el cliente
    await prisma.clienteBufete.delete({
      where: { id },
    });
    return { success: true, message: 'Cliente y su bitácora asociada eliminados con éxito.' };
  } catch (error: any) {
    console.error('Error al eliminar cliente del bufete:', error);
    if (error.code === 'P2025') { 
        return { success: false, message: 'Error: El cliente que intenta eliminar no existe.' };
    }
    // P2003 puede ocurrir si hay otras relaciones (ej. Citas si se reactivaran)
    if (error.code === 'P2003') { 
        return { success: false, message: 'Error: No se puede eliminar el cliente porque tiene otros registros asociados. Revise las relaciones.'};
    }
    return { success: false, message: 'Error interno al eliminar el cliente.' };
  }
}

export async function obtenerClienteBufetePorIdAccion(id: string): Promise<{
    success: boolean;
    cliente?: PrismaClienteBufete | null;
    message?: string;
}> {
    try {
        const cliente = await prisma.clienteBufete.findUnique({
            where: { id },
        });
        if (!cliente) {
            return { success: false, message: 'Cliente no encontrado.' };
        }
        return { success: true, cliente };
    } catch (error) {
        console.error('Error al obtener cliente del bufete por ID:', error);
        return { success: false, message: 'Error al cargar el cliente.' };
    }
}
