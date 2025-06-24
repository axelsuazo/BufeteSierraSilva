
'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { ADMIN_EMAIL_ADDRESS } from '@/lib/constants';

const formularioContactoSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  correoElectronico: z.string().email({ message: 'Correo electrónico inválido.' }),
  mensaje: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres.' }),
});

export type FormularioContactoData = z.infer<typeof formularioContactoSchema>;

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Usar Gmail
  auth: {
    user: process.env.EMAIL_USER, // Tu dirección de Gmail desde .env
    pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación de Gmail desde .env
  },
});

async function sendContactFormNotificationEmail(data: FormularioContactoData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Credenciales de email no configuradas. Omitiendo envío de correo de contacto.');
    // Mensaje ajustado para no decir "simulación"
    return { success: false, message: "Servicio de correo no configurado. No se pudo enviar la notificación." };
  }

  const mailOptions = {
    from: `"Notificaciones Web Sierra Silva" <${process.env.EMAIL_USER}>`,
    to: ADMIN_EMAIL_ADDRESS,
    replyTo: data.correoElectronico,
    subject: `Nuevo Mensaje de Contacto de: ${data.nombre}`,
    html: `
      <h1>Nuevo Mensaje del Formulario de Contacto</h1>
      <p>Has recibido un nuevo mensaje a través del formulario de contacto del sitio web:</p>
      <ul>
        <li><strong>Nombre:</strong> ${data.nombre}</li>
        <li><strong>Correo Electrónico:</strong> ${data.correoElectronico}</li>
      </ul>
      <h2>Mensaje:</h2>
      <p style="white-space: pre-wrap;">${data.mensaje}</p>
      <hr>
      <p>Puedes responder directamente a este correo para contactar a ${data.nombre} (${data.correoElectronico}).</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email de notificación de contacto enviado a:', ADMIN_EMAIL_ADDRESS);
    return { success: true, message: "Notificación de contacto enviada por email." };
  } catch (error) {
    console.error('Error enviando email de contacto:', error);
    return { success: false, message: "Error al enviar notificación por email de contacto." };
  }
}

export async function enviarFormularioContactoAccion(data: FormularioContactoData): Promise<{ success: boolean; message: string }> {
  const validatedFields = formularioContactoSchema.safeParse(data);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
      .join('; ');
    console.error("Error de validación en el servidor:", errorMessages);
    return {
      success: false,
      message: "Datos inválidos. Por favor, revise la información proporcionada.",
    };
  }

  let finalMessage = '';

  try {
    await prisma.mensajeContacto.create({
      data: {
        nombre: validatedFields.data.nombre,
        correoElectronico: validatedFields.data.correoElectronico,
        mensaje: validatedFields.data.mensaje,
      },
    });
    finalMessage += `Mensaje de ${validatedFields.data.nombre} guardado exitosamente. `;
    
    // Enviar notificación por correo
    const emailResult = await sendContactFormNotificationEmail(validatedFields.data);
    finalMessage += emailResult.message;

    return { success: true, message: finalMessage.trim() };
  } catch (error) {
    console.error("Error al guardar el mensaje de contacto en la base de datos:", error);
    return { success: false, message: "Error interno al procesar el mensaje. Por favor, inténtelo más tarde." };
  }
}

