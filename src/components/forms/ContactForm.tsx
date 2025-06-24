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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
// Importamos la acción del servidor y el tipo desde el archivo de acciones
import { enviarFormularioContactoAccion, type FormularioContactoData } from '@/actions/contact-actions';

// El esquema Zod ahora se define en contact-actions.ts, pero podemos re-declararlo aquí si es
// más conveniente para la validación del lado del cliente o simplemente importar el tipo.
// Para este ejemplo, nos basaremos en FormularioContactoData importado.
const formularioSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  correoElectronico: z.string().email({ message: 'Correo electrónico inválido.' }),
  mensaje: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres.' }),
});


export function ContactForm() {
  const { toast } = useToast();
  const form = useForm<FormularioContactoData>({
    resolver: zodResolver(formularioSchema), // Usamos el esquema Zod aquí para la validación del cliente
    defaultValues: {
      nombre: '',
      correoElectronico: '',
      mensaje: '',
    },
  });

  async function onSubmit(data: FormularioContactoData) {
    const result = await enviarFormularioContactoAccion(data);
    if (result.success) {
      toast({
        title: 'Formulario Enviado',
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        title: 'Error al Enviar',
        description: result.message,
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Su nombre" {...field} className="mt-1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormField
            control={form.control}
            name="correoElectronico"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="su@correo.com" {...field} className="mt-1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormField
            control={form.control}
            name="mensaje"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensaje</FormLabel>
                <FormControl>
                  <Textarea placeholder="Escriba su consulta aquí..." rows={5} {...field} className="mt-1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
        </Button>
      </form>
    </Form>
  );
}
