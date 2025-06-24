
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Scale, ShieldCheck, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-lg shadow-xl overflow-hidden min-h-[50vh] md:min-h-[60vh] flex items-center">
        <Image
          src="https://placehold.co/1600x900"
          alt="Bufete de Abogados"
          layout="fill"
          objectFit="cover"
          className="absolute z-0 opacity-30"
          data-ai-hint="law office building"
        />
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-6">
            Sierra Silva: Su Aliado Legal de Confianza
          </h1>
          <p className="text-lg sm:text-xl text-foreground mb-8 max-w-2xl mx-auto">
            Brindamos asesoría legal experta y soluciones personalizadas para proteger sus derechos e intereses.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-md transition-transform hover:scale-105">
              <Link href="/contact">Contáctenos <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 rounded-md shadow-md transition-transform hover:scale-105">
              <Link href="/services">Nuestros Servicios</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section>
        <h2 className="font-headline text-3xl font-semibold text-primary mb-8 text-center">Áreas de Práctica</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Derecho Civil', description: 'Contratos, herencias, reclamaciones de cantidad y más.', icon: Scale, hint: "legal balance scale" },
            { title: 'Derecho Penal', description: 'Asistencia en todas las fases del proceso penal.', icon: ShieldCheck, hint: "shield protection" },
            { title: 'Derecho Laboral', description: 'Despidos, acoso laboral, derechos del trabajador.', icon: Users, hint: "group employees" },
          ].map((service) => (
            <Card key={service.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
              <CardHeader className="items-center">
                <div className="p-3 bg-accent/10 rounded-full mb-3">
                  <service.icon className="h-10 w-10 text-accent" />
                </div>
                <CardTitle className="font-headline text-xl text-primary">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-foreground/80">{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="link" className="text-accent hover:text-accent/80 text-lg">
            <Link href="/services">Ver todos los servicios <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* About Us Snippet */}
      <section className="bg-card p-8 rounded-lg shadow-lg">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-headline text-3xl font-semibold text-primary mb-4">Quiénes Somos</h2>
            <p className="text-foreground/80 mb-4">
              Sierra Silva es un bufete de abogados comprometido con la excelencia y la defensa de sus clientes. Con años de experiencia, nuestro equipo multidisciplinar ofrece un servicio legal integral y de la más alta calidad.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md">
              <Link href="/about-us">Conozca Más <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
          <div>
            <Image
              src="https://placehold.co/600x400"
              alt="Equipo de Sierra Silva"
              width={600}
              height={400}
              className="rounded-lg shadow-md"
              data-ai-hint="lawyers team meeting"
            />
          </div>
        </div>
      </section>

      {/* Call to Action for Contact (replaces Booking) */}
      <section className="text-center py-12 bg-secondary/50 rounded-lg shadow-inner">
        <h2 className="font-headline text-3xl font-semibold text-primary mb-4">¿Necesita Asesoría Legal?</h2>
        <p className="text-lg text-foreground/80 mb-8">
          Póngase en contacto con nuestros expertos para analizar su caso y encontrar la mejor solución.
        </p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md shadow-md transition-transform hover:scale-105">
          <Link href="/contact">Contactar Ahora <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
      </section>
    </div>
  );
}
