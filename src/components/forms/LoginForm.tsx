
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { loginUserAction, type LoginUserData } from '@/actions/user-actions';
// Link ya no es necesario aquí si no hay página de registro
// import Link from 'next/link';


const formSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }), // Mantenemos una validación mínima
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginUserData) {
    const result = await loginUserAction(values);

    if (result.success && result.user) {
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: `Bienvenido, ${result.user.name || result.user.email}.`,
      });
      router.push('/admin/dashboard');
    } else {
      toast({
        title: 'Error de Inicio de Sesión',
        description: result.message || 'Credenciales incorrectas. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
      form.setValue('password', '');
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl rounded-lg">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
          <LogIn className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-3xl text-primary">Acceso Administrador</CardTitle>
        <CardDescription>Ingrese sus credenciales para acceder al panel de gestión.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="su@correo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        {/* Se elimina el enlace a la página de registro */}
        {/* <p className="text-xs text-muted-foreground">
            ¿No tiene una cuenta?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-xs">
                <Link href="/register">Regístrese Aquí</Link>
            </Button>
        </p> */}
        <p className="text-xs text-muted-foreground text-center w-full pt-2">
          Este acceso es para usuarios autorizados.
        </p>
      </CardFooter>
    </Card>
  );
}
