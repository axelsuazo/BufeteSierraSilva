
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, APP_NAME, LOGO_ICON as LogoIcon } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import * as React from 'react';

export function AppNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <LogoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-headline font-semibold text-foreground">
            {APP_NAME}
          </h1>
        </Link>

        {/* Navegación para Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "text-sm font-medium",
                (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                  ? "text-primary underline underline-offset-4"
                  : "text-foreground/70 hover:text-primary hover:underline-offset-4 hover:underline"
              )}
            >
              <Link href={item.href}>
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Trigger para Navegación Móvil */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-background p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-4">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <LogoIcon className="h-7 w-7 text-primary" />
                    <span className="font-headline text-lg font-semibold text-foreground">{APP_NAME}</span>
                  </Link>
                  <SheetClose asChild>
                     <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Cerrar menú</span>
                     </Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-2 p-4">
                  {NAV_ITEMS.map((item) => (
                    <SheetClose asChild key={item.label}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors",
                          (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
