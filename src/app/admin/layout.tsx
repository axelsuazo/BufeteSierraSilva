'use client'; // Necesario para useRouter y AuthContext (en el futuro)

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, LogOut, LayoutDashboard, Briefcase, Landmark } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    // En una implementación real, aquí se limpiaría la sesión (ej. token, cookie)
    // y se llamaría a una acción de logout del servidor si es necesario.
    // Por ahora, solo redirigimos.
    console.log("Cerrando sesión (simulado)...");
    router.push('/login');
  };
  
  // En el futuro, aquí se podría usar un AuthContext para verificar la autenticación
  // y redirigir si no está autenticado.
  // Ejemplo:
  // const { user, isLoading } = useAuth();
  // React.useEffect(() => {
  //   if (!isLoading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, isLoading, router]);
  // if (isLoading || !user) {
  //   return <p>Cargando...</p>; // O un spinner
  // }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            <span className="font-headline text-xl font-semibold text-primary">{APP_NAME} - Admin Panel</span>
          </Link>
          <nav className="flex items-center gap-2">
             <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/law-firm">
                <Briefcase className="mr-2 h-4 w-4" /> Bufete
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/loan-company">
                <Landmark className="mr-2 h-4 w-4" /> Préstamos
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Sitio Público
              </Link>
            </Button>
             <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Salir
             </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-8">
        {children}
      </main>
       <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME} Admin.
          </p>
        </div>
      </footer>
    </div>
  );
}
