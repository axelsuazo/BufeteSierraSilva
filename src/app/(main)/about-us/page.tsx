
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, Users, Target, Award, Scale } from 'lucide-react';

export default function AboutUsPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Sobre Sierra Silva</h1>
        <p className="text-lg text-foreground/80 mt-4 max-w-2xl mx-auto">
          Conozca nuestra historia, misión, visión y los valores que nos impulsan a ofrecerle el mejor servicio legal.
        </p>
      </header>

      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-headline text-3xl font-semibold text-primary mb-4">Nuestra Historia</h2>
            <p className="text-foreground/80 mb-3">
              Fundado con la visión de transformar la práctica legal, Sierra Silva nació de la unión de profesionales con una pasión compartida por la justicia y la innovación. Desde nuestros inicios, nos hemos dedicado a construir un bufete que no solo resuelve problemas legales, sino que también construye relaciones de confianza duraderas con nuestros clientes.
            </p>
            <p className="text-foreground/80">
              A lo largo de los años, hemos crecido y evolucionado, adaptándonos a los cambios del entorno legal y tecnológico, siempre con el objetivo de ofrecer soluciones eficientes y efectivas.
            </p>
          </div>
          <div className="rounded-lg overflow-hidden shadow-xl">
            <Image
              src="https://placehold.co/600x400"
              alt="Oficina de Sierra Silva"
              width={600}
              height={400}
              className="object-cover"
              data-ai-hint="modern law office"
            />
          </div>
        </div>
      </section>

      <section className="mb-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <div className="mx-auto bg-accent/10 p-3 rounded-full w-fit mb-2">
                <Target className="h-10 w-10 text-accent" />
              </div>
              <CardTitle className="font-headline text-2xl text-primary">Misión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70">Proveer asesoría legal integral y de alta calidad, enfocada en las necesidades específicas de cada cliente, buscando siempre la solución más favorable y eficiente.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <div className="mx-auto bg-accent/10 p-3 rounded-full w-fit mb-2">
                <Users className="h-10 w-10 text-accent" />
              </div>
              <CardTitle className="font-headline text-2xl text-primary">Visión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70">Ser el bufete de abogados líder y de referencia, reconocido por nuestra excelencia profesional, innovación tecnológica y compromiso inquebrantable con la justicia y nuestros clientes.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <div className="mx-auto bg-accent/10 p-3 rounded-full w-fit mb-2">
                <Award className="h-10 w-10 text-accent" />
              </div>
              <CardTitle className="font-headline text-2xl text-primary">Valores</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-foreground/70 text-left">
                <li>Integridad y Ética</li>
                <li>Compromiso con el Cliente</li>
                <li>Excelencia Profesional</li>
                <li>Innovación Constante</li>
                <li>Confidencialidad</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="text-center py-12 bg-secondary/30 rounded-lg px-6">
         <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Scale className="h-12 w-12 text-primary" />
          </div>
        <h2 className="font-headline text-3xl font-semibold text-primary mb-4">Comprometidos con la Justicia</h2>
        <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
          Nuestro equipo está aquí para escucharlo y ofrecerle la mejor representación legal.
        </p>
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md">
          <Link href="/contact">Hable con Nosotros</Link>
        </Button>
      </section>
    </div>
  );
}

