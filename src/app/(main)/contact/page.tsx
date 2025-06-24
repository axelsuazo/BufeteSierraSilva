
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Phone, Mail, MapPin, UserPlus, Smartphone, MessageSquareText } from 'lucide-react';
import Image from 'next/image';
import { WHATSAPP_CONTACT_NUMBER } from '@/lib/constants'; 

import { LawFirmClientForm, type LawFirmClientFormData } from '@/components/forms/LawFirmClientForm';
import { agregarClienteBufeteAccion } from '@/actions/lawfirm-client-actions';
import { useToast } from '@/hooks/use-toast';
import type { ClienteBufete } from '@prisma/client';

export default function ContactPage() {
  const whatsappMessage = encodeURIComponent("Hola, me gustaría obtener más información sobre sus servicios.");
  const whatsappLink = `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${whatsappMessage}`;
  const { toast } = useToast();

  const handleClientSubmit = async (data: LawFirmClientFormData): Promise<{ success: boolean; cliente?: ClienteBufete; message?: string }> => {
    const result = await agregarClienteBufeteAccion(data);
    if (result.success) {
      toast({
        title: 'Consulta Enviada',
        description: result.message || 'Su información ha sido recibida. Nos pondremos en contacto pronto.',
      });
      return { success: true, cliente: result.cliente, message: result.message };
    } else {
      toast({
        title: 'Error al Enviar Consulta',
        description: result.message || 'No se pudo procesar su solicitud. Por favor, inténtelo más tarde.',
        variant: 'destructive',
      });
      return { success: false, message: result.message };
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Contáctenos</h1>
        <p className="text-lg text-foreground/80 mt-4 max-w-2xl mx-auto">
          Estamos listos para escucharle. Póngase en contacto a través de nuestros canales o complete el formulario para enviarnos su consulta.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Columna de Información de Contacto y Mapa */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary flex items-center"><MapPin className="mr-2 h-6 w-6 text-accent" /> Nuestra Oficina</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">Av. Principal 123, Oficina 405<br />Ciudad Capital, País</p>
              <div className="mt-4 h-48 w-full rounded-md overflow-hidden">
                <Image src="https://placehold.co/400x300" alt="Mapa de ubicación" width={400} height={300} className="object-cover w-full h-full" data-ai-hint="city map location" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary flex items-center"><Phone className="mr-2 h-6 w-6 text-accent" /> Teléfono</CardTitle>
            </CardHeader>
            <CardContent>
              <a href="tel:+1234567890" className="text-foreground/80 hover:text-accent">+1 (234) 567-890</a>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary flex items-center"><Mail className="mr-2 h-6 w-6 text-accent" /> Correo Electrónico</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={`mailto:${process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'info@lexconnect.com'}`} className="text-foreground/80 hover:text-accent">{process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'info@lexconnect.com'}</a>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary flex items-center"><Smartphone className="mr-2 h-6 w-6 text-accent" /> WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-accent flex items-center">
                Enviar mensaje por WhatsApp
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 text-green-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><path d="M14.05 10.96 C13.28 12.26 11.36 13.89 10.11 13.41 C8.86 12.93 7.13 11.37 6.65 10.11 C6.17 8.86 7.73 7.13 8.99 6.65 C10.24 6.17 11.87 8.09 12.54 8.86 L14.05 10.96 Z"></path><path d="M19.05 4.94C18.19 4.08 17.07 3.46 15.95 3.07C14.83 2.68 13.62 2.54 12.42 2.68C11.22 2.82 10.08 3.24 9.06 3.9C8.04 4.56 7.18 5.46 6.54 6.54C5.46 7.18 4.56 8.04 3.9 9.06C3.24 10.08 2.82 11.22 2.68 12.42C2.54 13.62 2.68 14.83 3.07 15.95C3.46 17.07 4.08 18.19 4.94 19.05C5.8 19.91 6.92 20.53 8.04 20.92C9.16 21.31 10.37 21.45 11.57 21.31C12.77 21.17 13.91 20.75 14.93 20.09C15.95 19.43 16.81 18.53 17.45 17.45C18.53 16.81 19.43 15.95 20.09 14.93C20.75 13.91 21.17 12.77 21.31 11.57C21.45 10.37 21.31 9.16 20.92 8.04C20.53 6.92 19.91 5.8 19.05 4.94Z"></path></svg>
              </a>
              <p className="text-xs text-muted-foreground mt-1">Haz clic para chatear directamente.</p>
            </CardContent>
          </Card>
        </div>

        {/* Columna del Formulario */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <MessageSquareText className="mr-2 h-7 w-7 text-accent" /> Envíenos su Consulta
              </CardTitle>
              <CardDescription>Complete sus datos y su mensaje. Nos pondremos en contacto a la brevedad. Su información también se registrará como una consulta inicial.</CardDescription>
            </CardHeader>
            <CardContent>
              <LawFirmClientForm 
                onSubmitForm={handleClientSubmit}
                onClose={() => { /* En este contexto, el formulario no necesita cerrarse, simplemente se resetea */ }}
                isEditing={false} 
                showMensajeField={true} // Mostrar el campo de mensaje
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
