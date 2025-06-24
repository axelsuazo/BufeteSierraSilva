import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin, Mail, Phone, Award } from 'lucide-react';

const teamMembers = [
  {
    name: "Lic. Ana Rodríguez",
    role: "Socia Fundadora - Derecho Civil",
    imageUrl: "https://placehold.co/400x400",
    bio: "Con más de 15 años de experiencia, la Lic. Rodríguez es una experta reconocida en litigios civiles y derecho de familia. Su dedicación y enfoque estratégico han resultado en numerosos casos de éxito.",
    linkedin: "#",
    email: "mailto:ana.rodriguez@lexconnect.com",
    phone: "+1234567890",
    specialties: ["Derecho de Familia", "Contratos", "Herencias"],
    imageHint: "professional woman lawyer"
  },
  {
    name: "Lic. Carlos Vargas",
    role: "Socio - Derecho Penal",
    imageUrl: "https://placehold.co/400x400",
    bio: "El Lic. Vargas es un destacado penalista con una trayectoria impecable en la defensa de casos complejos. Su compromiso con los derechos de sus clientes es su principal motor.",
    linkedin: "#",
    email: "mailto:carlos.vargas@lexconnect.com",
    phone: "+1234567891",
    specialties: ["Delitos Económicos", "Defensa Penal", "Juicios Orales"],
    imageHint: "professional man lawyer"
  },
  {
    name: "Lic. Sofía Mendoza",
    role: "Asociada Senior - Derecho Laboral y Mercantil",
    imageUrl: "https://placehold.co/400x400",
    bio: "Especializada en derecho laboral y mercantil, la Lic. Mendoza asesora a empresas y particulares con un profundo conocimiento de la legislación vigente y un enfoque práctico.",
    linkedin: "#",
    email: "mailto:sofia.mendoza@lexconnect.com",
    phone: "+1234567892",
    specialties: ["Derecho Laboral", "Derecho Societario", "Conflictos Laborales"],
    imageHint: "corporate lawyer woman"
  },
   {
    name: "Lic. Javier Torres",
    role: "Asociado - Nuevas Tecnologías y Préstamos",
    imageUrl: "https://placehold.co/400x400",
    bio: "El Lic. Torres combina su conocimiento legal con un interés en las nuevas tecnologías, ofreciendo asesoramiento en áreas emergentes y en la estructuración de operaciones financieras.",
    linkedin: "#",
    email: "mailto:javier.torres@lexconnect.com",
    phone: "+1234567893",
    specialties: ["Derecho Tecnológico", "Fintech", "Contratos de Préstamo"],
    imageHint: "young lawyer male"
  },
];

export default function TeamPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Nuestro Equipo</h1>
        <p className="text-lg text-foreground/80 mt-4 max-w-2xl mx-auto">
          Profesionales apasionados y comprometidos con la excelencia, listos para defender sus intereses.
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {teamMembers.map((member) => (
          <Card key={member.name} className="shadow-xl rounded-lg overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/3 relative min-h-[250px] md:min-h-full">
              <Image
                src={member.imageUrl}
                alt={member.name}
                layout="fill"
                objectFit="cover"
                className="md:rounded-l-lg md:rounded-t-none rounded-t-lg"
                data-ai-hint={member.imageHint}
              />
            </div>
            <div className="md:w-2/3 p-6 flex flex-col">
              <CardHeader className="p-0 mb-2">
                <CardTitle className="font-headline text-2xl text-primary">{member.name}</CardTitle>
                <CardDescription className="text-accent font-semibold">{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-grow">
                <p className="text-foreground/70 text-sm mb-3">{member.bio}</p>
                <div className="mb-3">
                  <h4 className="font-semibold text-sm text-primary mb-1">Especialidades:</h4>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.map(spec => (
                      <span key={spec} className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">{spec}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
              <div className="mt-auto pt-3 border-t border-border">
                <div className="flex space-x-3 items-center text-accent">
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary"><Linkedin size={20} /></a>
                  <a href={member.email} className="hover:text-primary"><Mail size={20} /></a>
                  <a href={`tel:${member.phone}`} className="hover:text-primary"><Phone size={20} /></a>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <section className="mt-16 text-center py-12 bg-secondary/30 rounded-lg px-6">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
           <Award className="h-12 w-12 text-primary" />
        </div>
        <h2 className="font-headline text-3xl font-semibold text-primary mb-4">Un Equipo Dedicado a su Éxito</h2>
        <p className="text-lg text-foreground/80 mb-6 max-w-xl mx-auto">
          La combinación de experiencia, especialización y un enfoque centrado en el cliente nos permite ofrecer resultados sobresalientes.
        </p>
        <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-accent-foreground bg-accent hover:bg-accent/90">
          Contacte a un Especialista
        </a>
      </section>
    </div>
  );
}
