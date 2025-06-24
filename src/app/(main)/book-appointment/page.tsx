// src/app/(main)/book-appointment/page.tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import Link from 'next/link';

export default function BookAppointmentPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <header className="text-center mb-10">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Agendar Cita</h1>
      </header>
      <Alert variant="default" className="max-w-lg mx-auto shadow-md">
        <Info className="h-5 w-5 mr-2 text-primary" />
        <AlertTitle className="font-semibold text-lg">Función Desactivada</AlertTitle>
        <AlertDescription className="text-foreground/80">
          La función para agendar citas en línea ha sido desactivada temporalmente. 
          Para consultas o para programar una reunión, por favor, póngase en contacto con nosotros directamente.
        </AlertDescription>
      </Alert>
      <div className="text-center mt-8">
        <Button asChild size="lg">
          <Link href="/contact">Ir a Contacto</Link>
        </Button>
      </div>
    </div>
  );
}
