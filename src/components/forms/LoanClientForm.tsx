
'use client';

import React from 'react'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues } from 'react-hook-form'; // Import DefaultValues
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Landmark } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { LoanClientAndFirstApplicationFormData, SanitizedSolicitudPrestamoNumeric } from '@/actions/loan-actions';
// Importar TipoGarantia como valor, y ClientePrestamo como tipo
import { TipoGarantia, type ClientePrestamo } from '@prisma/client'; 

const loanFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  lastName: z.string().min(2, "El apellido es requerido."),
  dni: z.string().regex(/^\d{8,13}$/, "DNI inválido (8-13 dígitos)."),
  phone: z.string().regex(/^\+?\d{8,15}$/, "Número de celular inválido."),
  email: z.string().email("Correo electrónico inválido."),
  workplace: z.string().min(2, "Lugar de trabajo requerido."),
  workplaceAddress: z.string().optional(),
  homeAddress: z.string().min(5, "Dirección de casa requerida."),
  loanAmount: z.coerce.number().positive("La cantidad debe ser positiva."),
  collateralType: z.nativeEnum(TipoGarantia, { required_error: "Seleccione un tipo de garantía." }),
  collateralDescription: z.string().optional(),
  rtn: z.string().optional().or(z.literal('')),
  loanDate: z.date({ required_error: "Fecha de solicitud requerida." }),
  paymentNotes: z.string().optional(),
  loanTermMonths: z.coerce.number().int().positive("El plazo debe ser un número positivo de meses.").optional(),
  interestRate: z.coerce.number().min(0, "La tasa no puede ser negativa.").optional(),
});


interface LoanClientFormProps {
  onSubmitForm: (data: LoanClientAndFirstApplicationFormData) => Promise<{ success: boolean; cliente?: ClientePrestamo; solicitud?: SanitizedSolicitudPrestamoNumeric; message: string }>;
  onClose: () => void;
  initialData?: Partial<LoanClientAndFirstApplicationFormData>;
  isEditing?: boolean;
}

const getInitialFormValues = (data?: Partial<LoanClientAndFirstApplicationFormData>): DefaultValues<LoanClientAndFirstApplicationFormData> => {
  return {
    name: data?.name ?? '',
    lastName: data?.lastName ?? '',
    dni: data?.dni ?? '',
    phone: data?.phone ?? '',
    email: data?.email ?? '',
    workplace: data?.workplace ?? '',
    workplaceAddress: data?.workplaceAddress ?? '',
    homeAddress: data?.homeAddress ?? '',
    loanAmount: data?.loanAmount ?? 0,
    collateralType: data?.collateralType ?? undefined, // TipoGarantia enum or undefined
    collateralDescription: data?.collateralDescription ?? '',
    rtn: data?.rtn ?? '',
    loanDate: data?.loanDate ? new Date(data.loanDate) : new Date(),
    paymentNotes: data?.paymentNotes ?? '',
    loanTermMonths: data?.loanTermMonths !== undefined && data.loanTermMonths !== null ? Number(data.loanTermMonths) : undefined,
    interestRate: data?.interestRate !== undefined && data.interestRate !== null ? Number(data.interestRate) : undefined,
  };
};


export function LoanClientForm({ onSubmitForm, onClose, initialData, isEditing = false }: LoanClientFormProps) {
  const { toast } = useToast();
  
  const form = useForm<LoanClientAndFirstApplicationFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: getInitialFormValues(initialData),
  });
  
  React.useEffect(() => {
    form.reset(getInitialFormValues(initialData));
  }, [initialData, form]);


  async function handleSubmit(data: LoanClientAndFirstApplicationFormData) {
    const processedData: LoanClientAndFirstApplicationFormData = {
        ...data,
        workplaceAddress: data.workplaceAddress === '' ? undefined : data.workplaceAddress,
        collateralDescription: data.collateralDescription === '' ? undefined : data.collateralDescription,
        rtn: data.rtn === '' ? undefined : data.rtn,
        paymentNotes: data.paymentNotes === '' ? undefined : data.paymentNotes,
    };

    const result = await onSubmitForm(processedData); 
    if (result.success) {
        toast({
            title: `Cliente ${isEditing ? 'actualizado' : 'agregado'}`,
            description: result.message,
        });
      if (!isEditing) { 
        form.reset(getInitialFormValues(undefined)); 
      }
      onClose(); 
    } else {
      toast({
        title: 'Error',
        description: result.message || `Hubo un problema al ${isEditing ? 'actualizar' : 'guardar'} el cliente.`,
        variant: 'destructive',
      });
    }
  }
  
  const collateralTypesArray = Object.values(TipoGarantia).map(value => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ') }));


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nombres</FormLabel><FormControl><Input placeholder="Juan" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input placeholder="Pérez Rodríguez" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        
        <FormField control={form.control} name="dni" render={({ field }) => (
            <FormItem><FormLabel>DNI</FormLabel><FormControl><Input placeholder="0801199012345" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
         <FormField control={form.control} name="rtn" render={({ field }) => (
            <FormItem><FormLabel>RTN (Opcional)</FormLabel><FormControl><Input placeholder="08019999123456" {...field} value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <div className="grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Número de Celular</FormLabel><FormControl><Input placeholder="+50499887766" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" placeholder="juan.perez@correo.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>

        <FormField control={form.control} name="workplace" render={({ field }) => (
            <FormItem><FormLabel>Lugar de Trabajo</FormLabel><FormControl><Input placeholder="Empresa XYZ" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="workplaceAddress" render={({ field }) => (
            <FormItem><FormLabel>Dirección del Lugar de Trabajo (Opcional)</FormLabel><FormControl><Textarea placeholder="Col. Las Palmas, Calle Principal, Edificio A" {...field} value={field.value ?? ''} onChange={field.onChange}/></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="homeAddress" render={({ field }) => (
            <FormItem><FormLabel>Dirección de Casa</FormLabel><FormControl><Textarea placeholder="Res. Villa Serena, Bloque C, Casa #10" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-accent mb-3">Detalles de la Solicitud de Préstamo</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="loanAmount" render={({ field }) => (
                    <FormItem><FormLabel>Monto Solicitado (LPS)</FormLabel><FormControl><Input type="number" placeholder="50000" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="collateralType" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de Garantía</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione garantía" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {collateralTypesArray.map(type => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="collateralDescription" render={({ field }) => (
                <FormItem className="mt-4"><FormLabel>Descripción de la Garantía (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalles de la garantía, ej: Toyota Hilux 2020, placa HAA1234" {...field} value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="loanDate" render={({ field }) => (
                <FormItem className="flex flex-col mt-4"><FormLabel>Fecha de Solicitud</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(new Date(field.value), "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus locale={es}/>
                        </PopoverContent>
                    </Popover><FormMessage />
                </FormItem>
            )} />
            <div className="grid md:grid-cols-2 gap-4 mt-4">
                 <FormField control={form.control} name="loanTermMonths" render={({ field }) => (
                    <FormItem><FormLabel>Plazo del Préstamo (Meses)</FormLabel><FormControl><Input type="number" placeholder="Ej: 24" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="interestRate" render={({ field }) => (
                    <FormItem><FormLabel>Tasa Interés Anual (%)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ej: 15.5" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <FormField control={form.control} name="paymentNotes" render={({ field }) => (
                <FormItem className="mt-4"><FormLabel>Notas Adicionales del Préstamo/Pago (Opcional)</FormLabel><FormControl><Textarea placeholder="Ej: Plan de pagos, condiciones especiales, etc." {...field} value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar Cliente y Solicitud' : 'Agregar Cliente y Solicitud')}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    



    