

import { AppNavbar } from '@/components/layout/AppNavbar'; // Cambiado de AppSidebar a AppNavbar
import { APP_NAME } from '@/lib/constants';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col"> {/* Cambiado para layout de Navbar */}
      <AppNavbar /> {/* Usar AppNavbar */}
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8"> {/* Ajustado padding y container */}
        {children}
      </main>
      {/* Podrías añadir un footer común aquí si lo deseas */}
      <footer className="py-6 md:px-8 md:py-0 border-t bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
          </p>
          <nav className="flex gap-4 items-center">
            <Link href="/services" className="text-sm text-muted-foreground hover:text-primary">Servicios</Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contacto</Link>
            <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary">Admin</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
// Importación de Link añadida
import Link from 'next/link';

