import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Redirigir a la página de login ya que el registro está deshabilitado
  redirect('/login');
}