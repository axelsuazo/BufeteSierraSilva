import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Scale, ShieldCheck, Users, Building, Banknote, Landmark, FileText, Handshake } from "lucide-react";
import Image from "next/image";

const services = [
  { name: "Derecho Civil", description: "Asesoramiento y representación en disputas contractuales, responsabilidad civil, derechos reales, sucesiones y herencias.", icon: Scale, imageHint: "legal contract document" },
  { name: "Derecho Penal", description: "Defensa y acusación en todo tipo de delitos, asistencia al detenido y representación en juicios orales.", icon: ShieldCheck, imageHint: "courtroom gavel justice" },
  { name: "Derecho Laboral", description: "Asesoramiento a empresas y trabajadores en despidos, reclamaciones salariales, acoso laboral y negociación colectiva.", icon: Users, imageHint: "employees working office" },
  { name: "Derecho Mercantil", description: "Constitución de sociedades, fusiones y adquisiciones, contratos mercantiles y derecho concursal.", icon: Building, imageHint: "modern office building" },
  { name: "Derecho Administrativo", description: "Recursos contra la administración, licencias, sanciones y contratación pública.", icon: Landmark, imageHint: "government building architecture" },
  { name: "Consultoría en Préstamos", description: "Análisis de viabilidad, gestión de documentación y asesoramiento en la obtención de préstamos y financiación.", icon: Banknote, imageHint: "financial loan documents" },
  { name: "Gestión Documental Legal", description: "Organización, custodia y digitalización de documentos legales y expedientes.", icon: FileText, imageHint: "legal files folders" },
  { name: "Resolución Alternativa de Conflictos", description: "Mediación y arbitraje para la resolución de disputas de forma eficiente y amistosa.", icon: Handshake, imageHint: "business agreement handshake" },
];

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Nuestros Servicios</h1>
        <p className="text-lg text-foreground/80 mt-4 max-w-2xl mx-auto">
          En LexConnect, ofrecemos una amplia gama- de servicios legales y financieros para cubrir todas sus necesidades. Nuestro equipo de expertos está listo para asistirlo.
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <Card key={index} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
            <div className="relative h-48 w-full">
              <Image 
                src={`https://placehold.co/600x400?text=${service.name.replace(/\s/g,'+')}`} 
                alt={service.name} 
                layout="fill" 
                objectFit="cover"
                data-ai-hint={service.imageHint}
              />
            </div>
            <CardHeader className="pt-6">
              <div className="flex items-center mb-2">
                <service.icon className="h-8 w-8 text-accent mr-3" />
                <CardTitle className="font-headline text-2xl text-primary">{service.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-foreground/70">{service.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-16 py-12 bg-secondary/30 rounded-lg px-6 text-center">
        <h2 className="font-headline text-3xl font-semibold text-primary mb-4">¿Tiene un Caso Específico?</h2>
        <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
          Cada situación es única. Contáctenos para una consulta personalizada y descubra cómo podemos ayudarle.
        </p>
        <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-accent-foreground bg-accent hover:bg-accent/90">
          Solicitar Consulta
        </a>
      </section>
    </div>
  );
}
