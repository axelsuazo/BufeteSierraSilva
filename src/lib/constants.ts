
import type { LucideIcon } from 'lucide-react';
import { Home, Briefcase, Users, Users2, Phone, LogIn, Scale, Smartphone } from 'lucide-react'; // Added Smartphone

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  authRequired?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/services', label: 'Servicios', icon: Briefcase },
  { href: '/about-us', label: 'Quiénes Somos', icon: Users },
  { href: '/team', label: 'Equipo', icon: Users2 },
  { href: '/contact', label: 'Contacto', icon: Phone },
  { href: '/login', label: 'Ingresar', icon: LogIn },
];

export const APP_NAME = "Sierra Silva";
export const LOGO_ICON = Scale;

// Número de WhatsApp para contacto directo.
// Idealmente, este valor debería provenir de una variable de entorno.
export const WHATSAPP_CONTACT_NUMBER = "50487838026"; // Número actualizado
export const ADMIN_EMAIL_ADDRESS = process.env.ADMIN_EMAIL_NOTIFICATIONS || "keycontrahn@gmail.com";

