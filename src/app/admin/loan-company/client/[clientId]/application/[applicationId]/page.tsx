
// src/app/admin/loan-company/client/[clientId]/application/[applicationId]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react'; 
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, CalendarDays, DollarSign, Edit3, FileText, FileUp, Percent, RefreshCw, Trash2, UserCircle, Send, Receipt, Edit2Icon, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EstadoSolicitud, TipoGarantia, type SolicitudPrestamo as PrismaSolicitudPrestamo, type Documento as PrismaDocumentoOriginal, type ClientePrestamo as PrismaClientePrestamo, type PagoPrestamo as PrismaPagoPrestamoOriginal } from '@prisma/client';
import { getLoanApplicationByIdAction, updateLoanApplicationStatusAction, uploadLoanDocumentAction, deleteLoanDocumentAction } from '@/actions/loan-application-actions';
import { registrarPagoAccion, listarPagosPorSolicitudAccion, eliminarPagoAccion, actualizarPagoAccion, type ActualizarPagoData } from '@/actions/payment-actions';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns'; 
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Tipo para el pago donde montoPagado es un número
type PagoConNumero = Omit<PrismaPagoPrestamoOriginal, 'montoPagado'> & {
  montoPagado: number;
};

// Tipo para el documento sin contenidoArchivo
type DocumentoSinContenido = Omit<PrismaDocumentoOriginal, 'contenidoArchivo'>;

type SolicitudCompleta = Omit<PrismaSolicitudPrestamo, 'montoSolicitado' | 'montoAprobado' | 'tasaInteresAnual' | 'documentos'> & { 
    montoSolicitado: number;
    montoAprobado: number | null;
    tasaInteresAnual: number | null;
    documentos: DocumentoSinContenido[]; 
    cliente: PrismaClientePrestamo;
};

const pagoFormSchema = z.object({
  montoPagado: z.coerce.number().positive("El monto debe ser positivo."),
  fechaPago: z.date({ required_error: "Fecha de pago requerida." }),
  metodoPago: z.string().optional(),
  referenciaPago: z.string().optional(),
  notas: z.string().optional(),
});
type PagoFormData = z.infer<typeof pagoFormSchema>;


export default function LoanApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;

  const [solicitud, setSolicitud] = useState<SolicitudCompleta | null>(null);
  const [pagos, setPagos] = useState<PagoConNumero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingPago, setIsSubmittingPago] = useState(false);

  const [showDeletePagoConfirm, setShowDeletePagoConfirm] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState<PagoConNumero | null>(null);

  const [editingPago, setEditingPago] = useState<PagoConNumero | null>(null);


  const pagoForm = useForm<PagoFormData>({
    resolver: zodResolver(pagoFormSchema),
    defaultValues: {
      fechaPago: new Date(),
      montoPagado: 0,
      metodoPago: '',
      referenciaPago: '',
      notas: '',
    },
  });

  const cargarDatosCompletos = useCallback(async () => {
    if (!applicationId || applicationId === 'new') { 
        setIsLoading(false);
        if (applicationId !== 'new') {
             setError("ID de solicitud inválido.");
        }
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const solicitudResult = await getLoanApplicationByIdAction(applicationId);
      if (solicitudResult.success && solicitudResult.solicitud) {
        // Asegurar que los campos Decimal se conviertan a number para el estado local
        const s = solicitudResult.solicitud;
        const solicitudConNumeros: SolicitudCompleta = {
            ...s,
            montoSolicitado: Number(s.montoSolicitado),
            montoAprobado: s.montoAprobado !== null ? Number(s.montoAprobado) : null,
            tasaInteresAnual: s.tasaInteresAnual !== null ? Number(s.tasaInteresAnual) : null,
            documentos: s.documentos as DocumentoSinContenido[], // El select ya omite contenidoArchivo
            cliente: s.cliente,
        };
        setSolicitud(solicitudConNumeros);
        
        const pagosResult = await listarPagosPorSolicitudAccion(applicationId);
        if (pagosResult.success && pagosResult.pagos) {
          setPagos(pagosResult.pagos as PagoConNumero[]); 
        } else if (!pagosResult.success) {
          setError(prev => (prev ? prev + "; " : "") + (pagosResult.message || 'No se pudieron cargar los pagos.'));
          toast({ title: 'Error Pagos', description: pagosResult.message || 'Error al cargar pagos.', variant: 'destructive' });
        }
      } else {
        setError(prev => (prev ? prev + "; " : "") + (solicitudResult.message || 'No se pudo cargar la solicitud.'));
        toast({ title: 'Error Solicitud', description: solicitudResult.message || 'Solicitud no encontrada.', variant: 'destructive' });
      }

    } catch (e: any) {
      const errorMessage = e.message || 'Ocurrió un error inesperado al cargar los datos.';
      setError(errorMessage);
      toast({ title: 'Error Crítico', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, toast]);

  useEffect(() => {
    cargarDatosCompletos();
  }, [cargarDatosCompletos]);

  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return Number(amount).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  };

  const formatDate = (date?: Date | string | null, includeTime = false) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return dateObj.toLocaleDateString('es-HN', options);
  };
  
  const getEstadoSolicitudBadgeClass = (estado?: EstadoSolicitud) => {
    switch (estado) {
      case 'PENDIENTE_APROBACION': return 'bg-yellow-500/80 text-black hover:bg-yellow-600/80';
      case 'APROBADO': return 'bg-blue-500/80 text-white hover:bg-blue-600/80';
      case 'DESEMBOLSADO': return 'bg-green-500/80 text-white hover:bg-green-600/80';
      case 'EN_PAGO': return 'bg-teal-500/80 text-white hover:bg-teal-600/80';
      case 'PAGADO_COMPLETAMENTE': return 'bg-gray-700/80 text-white hover:bg-gray-800/80';
      case 'RECHAZADO': return 'bg-red-600/80 text-white hover:bg-red-700/80';
      case 'INCUMPLIMIENTO': return 'bg-red-800/80 text-white hover:bg-red-900/80';
      case 'CANCELADO': return 'bg-orange-500/80 text-white hover:bg-orange-600/80';
      default: return 'bg-gray-400/80 text-black hover:bg-gray-500/80';
    }
  };
  const estadoSolicitudOptions = Object.values(EstadoSolicitud);

  const handleStatusChange = async (solicitudId: string, nuevoEstado: EstadoSolicitud) => {
    const result = await updateLoanApplicationStatusAction({ solicitudId, nuevoEstado });
    if (result.success) {
      toast({ title: 'Estado Actualizado', description: result.message });
      cargarDatosCompletos(); 
    } else {
      toast({ title: 'Error al Cambiar Estado', description: result.message, variant: 'destructive' });
    }
  };

  const handleFileUpload = async () => {
    if (!fileToUpload || !solicitud) {
      toast({ title: "Error", description: "No hay archivo o solicitud seleccionada.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('solicitudPrestamoId', solicitud.id);
    // No estamos añadiendo descripción aquí, podría ser un campo adicional si se necesita.

    const result = await uploadLoanDocumentAction(formData);
    setIsUploading(false);
    if (result.success) {
      toast({ title: "Subida Exitosa", description: result.message });
      setFileToUpload(null); 
      const fileInput = document.getElementById('file-upload-input-details') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; 
      cargarDatosCompletos(); 
    } else {
      toast({ title: "Error de Subida", description: result.message, variant: "destructive" });
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
     if (!confirm(`¿Está seguro que desea eliminar el documento "${docName}"?`)) return;
     const result = await deleteLoanDocumentAction(docId);
     toast({ title: result.success ? "Documento Eliminado" : "Error", description: result.message, variant: result.success ? "default" : "destructive" });
     if (result.success) {
        cargarDatosCompletos(); 
     }
  };
  
  const handleEditPagoRequest = (pago: PagoConNumero) => {
    setEditingPago(pago);
    pagoForm.reset({
      montoPagado: pago.montoPagado,
      fechaPago: new Date(pago.fechaPago),
      metodoPago: pago.metodoPago || '',
      referenciaPago: pago.referenciaPago || '',
      notas: pago.notas || '',
    });
  };

  const handleCancelEditPago = () => {
    setEditingPago(null);
    pagoForm.reset({
      fechaPago: new Date(),
      montoPagado: 0,
      metodoPago: '',
      referenciaPago: '',
      notas: '',
    });
  };


  const handlePagoSubmit = async (data: PagoFormData) => {
    if (!solicitud) return;
    setIsSubmittingPago(true);
    
    let result;
    if (editingPago) {
      const dataToUpdate: ActualizarPagoData = {
        montoPagado: data.montoPagado,
        fechaPago: data.fechaPago,
        metodoPago: data.metodoPago || null,
        referenciaPago: data.referenciaPago || null,
        notas: data.notas || null,
      };
      result = await actualizarPagoAccion(editingPago.id, dataToUpdate);
    } else {
      result = await registrarPagoAccion({
        solicitudPrestamoId: solicitud.id,
        ...data,
      });
    }
    
    setIsSubmittingPago(false);
    if (result.success) {
      toast({ title: editingPago ? 'Pago Actualizado' : 'Pago Registrado', description: result.message });
      handleCancelEditPago(); 
      cargarDatosCompletos();
    } else {
      toast({ title: editingPago ? 'Error al Actualizar Pago' : 'Error al Registrar Pago', description: result.message, variant: 'destructive' });
    }
  };

  const handleDeletePagoRequest = (pago: PagoConNumero) => {
    setPagoToDelete(pago);
    setShowDeletePagoConfirm(true);
  };

  const handleConfirmDeletePago = async () => {
    if (!pagoToDelete) return;
    const result = await eliminarPagoAccion(pagoToDelete.id);
    if (result.success) {
      toast({ title: 'Pago Eliminado', description: result.message });
      cargarDatosCompletos();
    } else {
      toast({ title: 'Error al Eliminar Pago', description: result.message, variant: 'destructive' });
    }
    setShowDeletePagoConfirm(false);
    setPagoToDelete(null);
  };


  if (applicationId === 'new') {
    return (
         <div className="container mx-auto py-8 px-4 text-center">
            <Alert className="mb-4">
              <AlertTitle>Nueva Solicitud</AlertTitle>
              <AlertDescription>Las nuevas solicitudes se gestionan a través del formulario principal de "Agregar Nuevo Cliente y Solicitud" en la página de Préstamos.</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/admin/loan-company')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Préstamos
            </Button>
        </div>
    );
  }
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><RefreshCw className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Cargando detalles de la solicitud...</p></div>;
  }

  if (error || !solicitud) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Solicitud</AlertTitle>
          <AlertDescription>{error || "No se encontró la solicitud."}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/admin/loan-company')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Préstamos
        </Button>
      </div>
    );
  }

  const totalPagado = pagos.reduce((sum, pago) => sum + Number(pago.montoPagado), 0);
  const saldoPendiente = (Number(solicitud.montoAprobado) ?? Number(solicitud.montoSolicitado)) - totalPagado;


  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/loan-company')} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Préstamos
            </Button>
            <h1 className="font-headline text-3xl font-bold text-primary">Detalles de Solicitud de Préstamo</h1>
            <p className="text-md text-foreground/80 mt-1">
                ID Solicitud: {solicitud.id.substring(0,12)}...
            </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={cargarDatosCompletos} variant="outline" disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Recargando...' : 'Recargar Detalles'}
            </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center"><UserCircle className="mr-2 h-6 w-6" /> Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Nombre:</strong> {solicitud.cliente.nombres} {solicitud.cliente.apellidos}</p>
            <p><strong>DNI:</strong> {solicitud.cliente.dni}</p>
            <p><strong>RTN:</strong> {solicitud.cliente.rtn || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {solicitud.cliente.telefono}</p>
            <p><strong>Email:</strong> {solicitud.cliente.correoElectronico}</p>
            <p><strong>Lugar de Trabajo:</strong> {solicitud.cliente.lugarTrabajo}</p>
            <p><strong>Dir. Trabajo:</strong> {solicitud.cliente.direccionTrabajo || 'N/A'}</p>
            <p><strong>Dir. Casa:</strong> {solicitud.cliente.direccionCasa}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center"><DollarSign className="mr-2 h-6 w-6" /> Detalles del Préstamo</CardTitle>
             <div className="flex items-center gap-4 mt-2">
                <Badge className={cn("text-base px-3 py-1", getEstadoSolicitudBadgeClass(solicitud.estado))}>
                    {solicitud.estado.replace(/_/g, ' ')}
                </Badge>
                <Select
                    value={solicitud.estado}
                    onValueChange={(value) => handleStatusChange(solicitud.id, value as EstadoSolicitud)}
                    >
                    <SelectTrigger className="h-9 text-xs w-[200px]">
                        <SelectValue placeholder="Cambiar estado" />
                    </SelectTrigger>
                    <SelectContent>
                        {estadoSolicitudOptions.map(estadoOpt => (
                        <SelectItem key={estadoOpt} value={estadoOpt} className="text-xs">
                            {estadoOpt.replace(/_/g, ' ')}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                <p><strong>Monto Solicitado:</strong> {formatCurrency(solicitud.montoSolicitado)}</p>
                <p><strong>Monto Aprobado:</strong> {formatCurrency(solicitud.montoAprobado)}</p>
                <p><strong>Fecha Solicitud:</strong> {formatDate(solicitud.fechaSolicitud)}</p>
                <p><strong>Fecha Aprobación:</strong> {formatDate(solicitud.fechaAprobacion)}</p>
                <p><strong>Fecha Desembolso:</strong> {formatDate(solicitud.fechaDesembolso)}</p>
                <p><strong>Tipo Garantía:</strong> {solicitud.tipoGarantia.replace(/_/g, ' ')}</p>
                <p><strong>Plazo:</strong> {solicitud.plazoMeses ? `${solicitud.plazoMeses} meses` : 'N/A'}</p>
                <p><strong>Tasa Anual:</strong> {solicitud.tasaInteresAnual !== null ? `${solicitud.tasaInteresAnual}%` : 'N/A'}</p>
            </div>
            <Separator />
            <p><strong>Descripción Garantía:</strong></p>
            <p className="text-foreground/80 whitespace-pre-wrap">{solicitud.descripcionGarantia || 'N/A'}</p>
            <Separator />
            <p><strong>Notas Adicionales/Pago:</strong></p>
            <p className="text-foreground/80 whitespace-pre-wrap">{solicitud.notasDePago || 'N/A'}</p>
            <Separator />
            <p><strong>Total Pagado:</strong> <span className="font-semibold text-green-600">{formatCurrency(totalPagado)}</span></p>
            <p><strong>Saldo Pendiente:</strong> <span className="font-semibold text-red-600">{formatCurrency(saldoPendiente)}</span></p>
            <Separator />
            <p><strong>Última Actualización:</strong> {formatDate(solicitud.fechaUltimaActualizacion, true)}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center"><FileText className="mr-2 h-6 w-6" /> Documentos Adjuntos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 border rounded-md">
            <h4 className="text-md font-medium mb-2">Subir Nuevo Documento</h4>
            <div className="flex items-center gap-2">
                <Input 
                    id="file-upload-input-details"
                    type="file" 
                    onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)} 
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="flex-grow"
                />
                <Button onClick={handleFileUpload} disabled={!fileToUpload || isUploading} size="sm">
                    {isUploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Subiendo...' : 'Subir'}
                </Button>
            </div>
            {fileToUpload && <p className="text-xs mt-1 text-muted-foreground">Seleccionado: {fileToUpload.name}</p>}
          </div>
          
          {solicitud.documentos && solicitud.documentos.length > 0 ? (
            <ScrollArea className="h-[200px] pr-3">
              <ul className="space-y-2">
                {solicitud.documentos.map(doc => (
                  <li key={doc.id} className="flex justify-between items-center p-2 border rounded-md hover:bg-muted transition-colors">
                    <div>
                      <a href={doc.urlDocumento ?? '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium truncate" title={doc.nombreDocumento}>
                        <FileText className="inline mr-2 h-4 w-4" />{doc.nombreDocumento}
                      </a>
                      <p className="text-xs text-muted-foreground ml-6">
                        {doc.tipoDocumento} - {doc.tamanoBytes ? `${(doc.tamanoBytes / 1024).toFixed(1)} KB` : 'Tamaño N/A'} - Subido: {formatDate(doc.fechaSubida)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDocument(doc.id, doc.nombreDocumento)} title="Eliminar documento">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">No hay documentos adjuntos para esta solicitud.</p>
          )}
        </CardContent>
      </Card>

       <Card className="shadow-lg" id="pago-form-section">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center"><Receipt className="mr-2 h-6 w-6" /> {editingPago ? 'Editar Pago' : 'Registrar Nuevo Pago'}</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={pagoForm.handleSubmit(handlePagoSubmit)} className="mb-6 p-4 border rounded-md space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="montoPagado">Monto Pagado (LPS)</Label>
                        <Input id="montoPagado" type="number" step="0.01" {...pagoForm.register("montoPagado")} />
                        {pagoForm.formState.errors.montoPagado && <p className="text-xs text-destructive">{pagoForm.formState.errors.montoPagado.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="fechaPago">Fecha de Pago</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="fechaPago"
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !pagoForm.watch("fechaPago") && "text-muted-foreground")}
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    {pagoForm.watch("fechaPago") ? format(pagoForm.watch("fechaPago"), "PPP", {locale: es}) : <span>Seleccione fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <ShadCalendar
                                    mode="single"
                                    selected={pagoForm.watch("fechaPago")}
                                    onSelect={(date) => pagoForm.setValue("fechaPago", date || new Date(), {shouldValidate: true})}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                        {pagoForm.formState.errors.fechaPago && <p className="text-xs text-destructive">{pagoForm.formState.errors.fechaPago.message}</p>}
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="metodoPago">Método de Pago (Opcional)</Label>
                        <Input id="metodoPago" {...pagoForm.register("metodoPago")} placeholder="Ej: Transferencia, Efectivo"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="referenciaPago">Referencia (Opcional)</Label>
                        <Input id="referenciaPago" {...pagoForm.register("referenciaPago")} placeholder="Ej: # Transacción, # Cheque"/>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="notasPago">Notas (Opcional)</Label>
                    <Textarea id="notasPago" {...pagoForm.register("notas")} placeholder="Notas adicionales sobre el pago"/>
                </div>
                <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmittingPago} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        {isSubmittingPago ? <RefreshCw className="animate-spin mr-2"/> : (editingPago ? <Edit3 className="mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4"/>)}
                        {isSubmittingPago ? (editingPago ? "Actualizando..." : "Registrando...") : (editingPago ? "Actualizar Pago" : "Registrar Pago")}
                    </Button>
                    {editingPago && (
                        <Button type="button" variant="outline" onClick={handleCancelEditPago}>
                            <XCircle className="mr-2 h-4 w-4"/> Cancelar Edición
                        </Button>
                    )}
                </div>
            </form>
            
            <Separator className="my-4"/>

            <h4 className="text-md font-medium mb-2">Pagos Realizados ({pagos.length})</h4>
            {pagos.length > 0 ? (
                <ScrollArea className="h-[250px] pr-3">
                    <div className="space-y-3">
                    {pagos.map(pago => (
                        <Card key={pago.id} className="p-3 text-sm bg-muted/30">
                           <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-primary">{formatCurrency(pago.montoPagado)}</p>
                                    <p className="text-xs text-muted-foreground">Pagado el: {formatDate(pago.fechaPago)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-xs">{pago.metodoPago || "No especificado"}</Badge>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditPagoRequest(pago)} title="Editar pago">
                                        <Edit2Icon className="h-4 w-4 text-blue-600" />
                                    </Button>
                                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeletePagoRequest(pago)} title="Eliminar pago">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                           </div>
                            {pago.referenciaPago && <p className="text-xs mt-1">Ref: {pago.referenciaPago}</p>}
                            {pago.notas && <p className="text-xs mt-1 italic">Notas: {pago.notas}</p>}
                            <p className="text-xs text-muted-foreground mt-1">Registrado: {formatDate(pago.fechaRegistro, true)}</p>
                        </Card>
                    ))}
                    </div>
                </ScrollArea>
            ) : (
                <p className="text-sm text-muted-foreground">No hay pagos registrados para esta solicitud.</p>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeletePagoConfirm} onOpenChange={setShowDeletePagoConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Eliminación de Pago?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. ¿Está seguro que desea eliminar este pago?
                {pagoToDelete && 
                    <div className="mt-2 text-sm border p-2 rounded-md bg-muted/50">
                        <p><strong>Monto:</strong> {formatCurrency(pagoToDelete.montoPagado)}</p>
                        <p><strong>Fecha:</strong> {formatDate(pagoToDelete.fechaPago)}</p>
                    </div>
                }
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setShowDeletePagoConfirm(false); setPagoToDelete(null);}}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeletePago} className="bg-destructive hover:bg-destructive/90">Eliminar Pago</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    
