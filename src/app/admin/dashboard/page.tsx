
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Landmark, ArrowRight, Users, FileText } from 'lucide-react';
import Image from 'next/image';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary">Panel de Administración</h1>
        <p className="text-lg text-foreground/80 mt-2">
          Bienvenido al panel de control de Sierra Silva. Seleccione un módulo para comenzar.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg">
          <CardHeader>
             <div className="flex items-center mb-3">
                <div className="p-3 bg-primary/10 rounded-full mr-3">
                    <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl text-primary">Módulo: Bufete de Abogados</CardTitle>
            </div>
            <CardDescription>
              Gestione clientes, casos, bitácoras, pagos y documentación relacionada con los servicios legales del bufete.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image src="https://placehold.co/600x300" alt="Bufete de Abogados" width={600} height={300} className="rounded-md mb-4" data-ai-hint="lawyers working office" />
            <p className="text-sm text-foreground/70">Acceda a herramientas para la administración integral de los expedientes legales, seguimiento de progresos y comunicación con clientes.</p>
            <ul className="list-disc list-inside text-sm text-foreground/70 space-y-1 pl-4">
                <li><Users className="inline mr-1 h-4 w-4 text-accent" /> Administración de Clientes</li>
                <li><FileText className="inline mr-1 h-4 w-4 text-accent" /> Seguimiento de Casos</li>
                <li><Briefcase className="inline mr-1 h-4 w-4 text-accent" /> Gestión Documental</li>
            </ul>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md">
              <Link href="/admin/law-firm">Acceder al Módulo de Bufete <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg">
          <CardHeader>
            <div className="flex items-center mb-3">
                <div className="p-3 bg-accent/10 rounded-full mr-3">
                    <Landmark className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="font-headline text-2xl text-accent">Módulo: Empresa de Préstamos</CardTitle>
            </div>
            <CardDescription>
              Administre clientes de préstamos, solicitudes, garantías, documentos firmados, fechas de pago y cobros pendientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image src="https://placehold.co/600x300" alt="Empresa de Préstamos" width={600} height={300} className="rounded-md mb-4" data-ai-hint="financial loan agreement" />
            <p className="text-sm text-foreground/70">Herramientas especializadas para la gestión de cartera de préstamos, control de pagos y documentación crediticia.</p>
             <ul className="list-disc list-inside text-sm text-foreground/70 space-y-1 pl-4">
                <li><Users className="inline mr-1 h-4 w-4 text-primary" /> Gestión de Clientes de Préstamos</li>
                <li><FileText className="inline mr-1 h-4 w-4 text-primary" /> Control de Documentación</li>
                <li><Landmark className="inline mr-1 h-4 w-4 text-primary" /> Seguimiento de Pagos</li>
            </ul>
          </CardContent>
           <div className="p-6 pt-0">
            <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-md">
              <Link href="/admin/loan-company">Acceder al Módulo de Préstamos <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

