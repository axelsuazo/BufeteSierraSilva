
import { LoginForm } from '@/components/forms/LoginForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <LoginForm />
    </div>
  );
}
