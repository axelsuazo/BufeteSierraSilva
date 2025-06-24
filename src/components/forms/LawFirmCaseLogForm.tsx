
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { CaseLogEntryFormData } from '@/actions/lawfirm-caselog-actions'; // Mantenemos este tipo para referencia

// Esquema Zod para el formulario, solo los campos que el formulario maneja directamente
const formSchema = z.object({
  descripcion: z.string().min(5, { message: 'La descripción debe tener al menos 5 caracteres.' }).max(1000, {message: 'La descripción no puede exceder los 1000 caracteres.'}),
  tipoActuacion: z.string().optional().default(''), // Permitir que sea string vacío para luego convertir a null si es necesario
});

// Tipo para los valores del formulario que maneja este componente
export type CaseLogFormValues = z.infer<typeof formSchema>;

interface LawFirmCaseLogFormProps {
  onSubmitForm: (data: CaseLogFormValues) => Promise<void>; // El padre decide si es agregar o actualizar
  onCancel: () => void;
  initialData?: Partial<CaseLogFormValues>;
  isEditing?: boolean;
}

export function LawFirmCaseLogForm({ 
    onSubmitForm, 
    onCancel, 
    initialData, 
    isEditing = false 
}: LawFirmCaseLogFormProps) {
  const { toast } = useToast(); // Aunque el toast principal podría estar en la página, puede ser útil aquí para errores de form.

  const form = useForm<CaseLogFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      descripcion: '',
      tipoActuacion: '',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        descripcion: initialData.descripcion || '',
        tipoActuacion: initialData.tipoActuacion || '',
      });
    } else {
      form.reset({
        descripcion: '',
        tipoActuacion: '',
      });
    }
  }, [initialData, form]);

  async function handleSubmit(data: CaseLogFormValues) {
    // La lógica de llamar a agregarEntradaBitacoraClienteAccion o actualizar...
    // ahora se manejará en la página padre a través de onSubmitForm.
    await onSubmitForm(data);
    // El reset y el cierre del formulario se pueden manejar en el padre si se desea
    // o aquí después de una sumisión exitosa.
    // Por ahora, el padre (log/page.tsx) manejará el reset y cierre.
  }

  const tiposActuacionSugeridos = [
    "Llamada Telefónica",
    "Reunión con Cliente",
    "Presentación de Escrito",
    "Recepción de Documento",
    "Investigación",
    "Audiencia",
    "Análisis de Caso",
    "Comunicación con Contraparte",
    "Diligencia Judicial",
    "Revisión de Expediente",
    "Otro",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción de la Actuación</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalle la actuación realizada o el evento ocurrido..."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tipoActuacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Actuación (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Llamada, Reunión, Documento" 
                  {...field} 
                  list="tipos-actuacion-list"
                />
              </FormControl>
              <datalist id="tipos-actuacion-list">
                {tiposActuacionSugeridos.map(tipo => (
                  <option key={tipo} value={tipo} />
                ))}
              </datalist>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting 
                ? (isEditing ? 'Actualizando...' : 'Agregando...') 
                : (isEditing ? 'Guardar Cambios' : 'Agregar Entrada')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
