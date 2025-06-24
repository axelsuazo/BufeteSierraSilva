

'use client';

import * as React from 'react';
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
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { ClienteBufete as PrismaClienteBufete } from '@prisma/client';


// Esquema Zod para el formulario del cliente del bufete
const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  phone: z.string().regex(/^\+?\d{8,15}$/, { message: 'Número de celular inválido.' }).optional().or(z.literal('')),
  dni: z.string().regex(/^\d{8,13}$/, { message: 'DNI inválido (debe tener entre 8 y 13 dígitos).' }).optional().or(z.literal('')),
  workplace: z.string().optional().or(z.literal('')),
  caseType: z.string({ required_error: 'Debe seleccionar un tipo de proceso.' }),
  message: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres.' }).optional().or(z.literal('')), // Nuevo campo para mensaje
});

export type LawFirmClientFormData = z.infer<typeof formSchema>;

interface LawFirmClientFormProps {
  onSubmitForm: (data: LawFirmClientFormData) => Promise<{ success: boolean; cliente?: PrismaClienteBufete; message?: string }>;
  onClose: () => void;
  initialData?: Partial<LawFirmClientFormData>;
  isEditing?: boolean;
  showMensajeField?: boolean; // Nueva prop para controlar la visibilidad del campo mensaje
}

const caseTypes = [
    { value: 'Derecho Civil', label: 'Derecho Civil' },
    { value: 'Derecho Penal', label: 'Derecho Penal' },
    { value: 'Derecho Laboral', label: 'Derecho Laboral' },
    { value: 'Derecho Mercantil', label: 'Derecho Mercantil' },
    { value: 'Derecho Administrativo', label: 'Derecho Administrativo' },
    { value: 'Derecho de Familia', label: 'Derecho de Familia' },
    { value: 'Consultoría en Préstamos', label: 'Consultoría en Préstamos' },
    { value: 'Consulta General', label: 'Consulta General' }, // Opción para contacto
    { value: 'Otros', label: 'Otro Tipo de Proceso' },
];

export function LawFirmClientForm({ 
    onSubmitForm, 
    onClose, 
    initialData, 
    isEditing = false, 
    showMensajeField = false // Por defecto no se muestra, para la página de contacto se pasará true
}: LawFirmClientFormProps) {
  const { toast } = useToast();
  const form = useForm<LawFirmClientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      lastName: '',
      email: '',
      phone: '',
      dni: '',
      workplace: '',
      caseType: showMensajeField ? 'Consulta General' : '', // Default a 'Consulta General' si el campo mensaje se muestra
      message: '',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        caseType: initialData.caseType || (showMensajeField ? 'Consulta General' : ''),
        message: initialData.message || '',
      });
    } else {
        form.reset({
            name: '',
            lastName: '',
            email: '',
            phone: '',
            dni: '',
            workplace: '',
            caseType: showMensajeField ? 'Consulta General' : '',
            message: '',
        });
    }
  }, [initialData, form, showMensajeField]);


  async function handleSubmit(data: LawFirmClientFormData) {
    const result = await onSubmitForm(data);
    if (result.success) {
      if (!isEditing) { // Solo resetear si es un nuevo registro
        form.reset({ 
            name: '', 
            lastName: '', 
            email: '', 
            phone: '', 
            dni: '', 
            workplace: '', 
            caseType: showMensajeField ? 'Consulta General' : '',
            message: '' 
        });
      }
      // onClose se llama desde la página que usa el formulario
    } else {
      toast({
        title: 'Error',
        description: result.message || `Hubo un problema al ${isEditing ? 'actualizar' : 'guardar'} el cliente.`,
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre(s)</FormLabel>
                    <FormControl><Input placeholder="Ej: María José" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Apellido(s)</FormLabel>
                    <FormControl><Input placeholder="Ej: Rodríguez Paz" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl><Input type="email" placeholder="ej: maria.rod@correo.com" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Teléfono (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ej: +50498765432" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>DNI/ID (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ej: 0801199012345" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="workplace"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Lugar de Trabajo (Opcional)</FormLabel>
                <FormControl><Input placeholder="Ej: Empresa ABC" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="caseType"
            render={({ field }) => (
            <FormItem>
                <FormLabel>{showMensajeField ? "Asunto Principal" : "Tipo de Caso/Proceso"}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {caseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                        {type.label}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />

        {showMensajeField && (
            <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Su Mensaje (Opcional, min. 10 caracteres si se ingresa)</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Escriba su consulta o mensaje aquí..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting 
                ? (isEditing ? 'Actualizando...' : (showMensajeField ? 'Enviando Consulta...' : 'Guardando...')) 
                : (isEditing ? 'Guardar Cambios' : (showMensajeField ? 'Enviar Consulta' : 'Agregar Cliente'))
            }
            </Button>
        </div>
      </form>
    </Form>
  );
}
