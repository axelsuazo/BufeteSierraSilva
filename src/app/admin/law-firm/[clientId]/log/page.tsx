
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, BookText, Edit3, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BitacoraClienteBufete as PrismaBitacoraClienteBufete, ClienteBufete as PrismaClienteBufete } from '@prisma/client';
import { LawFirmCaseLogForm, type CaseLogFormValues } from '@/components/forms/LawFirmCaseLogForm';
import { 
  listarEntradasBitacoraClienteAccion,
  agregarEntradaBitacoraClienteAccion,
  actualizarEntradaBitacoraClienteAccion,
  eliminarEntradaBitacoraClienteAccion,
  type CaseLogEntryFormData, // Para el 'agregar'
  type UpdateCaseLogEntryFormData // Para el 'actualizar'
} from '@/actions/lawfirm-caselog-actions';
import { obtenerClienteBufetePorIdAccion } from '@/actions/lawfirm-client-actions';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function LawFirmClientLogPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  
  const [cliente, setCliente] = useState<PrismaClienteBufete | null>(null);
  const [entradasBitacora, setEntradasBitacora] = useState<PrismaBitacoraClienteBufete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PrismaBitacoraClienteBufete | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<PrismaBitacoraClienteBufete | null>(null);


  const cargarDatos = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [clienteResult, bitacoraResult] = await Promise.all([
        obtenerClienteBufetePorIdAccion(clientId),
        listarEntradasBitacoraClienteAccion(clientId)
      ]);

      if (clienteResult.success && clienteResult.cliente) {
        setCliente(clienteResult.cliente);
      } else {
        setError(clienteResult.message || 'No se pudo cargar la información del cliente.');
        toast({ title: 'Error', description: clienteResult.message || 'Cliente no encontrado.', variant: 'destructive' });
      }

      if (bitacoraResult.success && bitacoraResult.entradas) {
        setEntradasBitacora(bitacoraResult.entradas);
      } else {
        if(!bitacoraResult.success){
            setError((prevError) => prevError ? `${prevError} ${bitacoraResult.message}` : bitacoraResult.message || 'No se pudieron cargar las entradas de la bitácora.');
            toast({ title: 'Error Bitácora', description: bitacoraResult.message || 'Error al cargar bitácora.', variant: 'destructive' });
        }
      }
    } catch (e: any) {
      const errorMessage = e.message || 'Ocurrió un error inesperado al cargar los datos.';
      setError(errorMessage);
      toast({ title: 'Error Crítico', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleOpenFormForNew = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  const handleOpenFormForEdit = (entry: PrismaBitacoraClienteBufete) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null); 
  };

  const handleFormSubmit = async (formData: CaseLogFormValues) => {
    let result;
    if (editingEntry) {
      // Actualizar
      const dataToUpdate: UpdateCaseLogEntryFormData = {
        descripcion: formData.descripcion,
        // Asegurarse que tipoActuacion es string o null. Si es string vacío, se convertirá a null en la acción.
        tipoActuacion: formData.tipoActuacion === '' ? null : formData.tipoActuacion,
      };
      result = await actualizarEntradaBitacoraClienteAccion(editingEntry.id, dataToUpdate);
    } else {
      // Agregar
      const dataToAdd: CaseLogEntryFormData = {
        ...formData,
        clienteId: clientId,
      };
      result = await agregarEntradaBitacoraClienteAccion(dataToAdd);
    }

    if (result.success) {
      toast({ title: 'Éxito', description: result.message });
      handleCloseForm();
      cargarDatos();
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo guardar la entrada.', variant: 'destructive' });
      if (result.errors) console.error("Errores de validación:", result.errors);
    }
  };

  const handleDeleteRequest = (entry: PrismaBitacoraClienteBufete) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    const result = await eliminarEntradaBitacoraClienteAccion(entryToDelete.id);
    if (result.success) {
      toast({ title: 'Entrada Eliminada', description: result.message });
      cargarDatos();
    } else {
      toast({ title: 'Error al Eliminar', description: result.message, variant: 'destructive' });
    }
    setShowDeleteConfirm(false);
    setEntryToDelete(null);
  };


  const formatDateTime = (dateString?: Date | string) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('es-HN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };
  

  if (isLoading && !cliente) {
    return <div className="flex justify-center items-center h-screen"><RefreshCw className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Cargando datos de la bitácora...</p></div>;
  }

  if (error && !cliente) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Cliente</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/admin/law-firm')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Clientes
        </Button>
      </div>
    );
  }
  
  if (!cliente) {
     return (
        <div className="container mx-auto py-8 px-4 text-center">
            <p className="text-muted-foreground mb-4">Cliente no encontrado o no se pudo cargar la información.</p>
            <Button onClick={() => router.push('/admin/law-firm')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Clientes
            </Button>
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/law-firm')} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Clientes
            </Button>
            <h1 className="font-headline text-3xl font-bold text-primary">Bitácora del Cliente</h1>
            <p className="text-md text-foreground/80 mt-1">
                {cliente.nombres} {cliente.apellidos} (DNI: {cliente.dni || 'N/A'})
            </p>
            <p className="text-sm text-muted-foreground">Tipo de Caso: {cliente.tipoCaso}</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={cargarDatos} variant="outline" disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Recargando...' : 'Recargar Bitácora'}
            </Button>
            {!isFormOpen && (
                <Button onClick={handleOpenFormForNew} className="bg-primary hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-5 w-5" /> Agregar Nueva Entrada
                </Button>
            )}
        </div>
      </header>

      {error && !entradasBitacora.length && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al Cargar Bitácora</AlertTitle>
          <AlertDescription>{error.replace(cliente?.nombres || '', '').replace(cliente?.apellidos || '', '').trim()}</AlertDescription>
        </Alert>
      )}

      {isFormOpen && (
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">
                {editingEntry ? 'Editar Entrada en Bitácora' : 'Nueva Entrada en Bitácora'}
            </CardTitle>
            <CardDescription>
                {editingEntry ? 'Modifique los detalles de la entrada.' : 'Registre una nueva actuación o evento para este cliente.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LawFirmCaseLogForm 
                onSubmitForm={handleFormSubmit} 
                onCancel={handleCloseForm}
                initialData={editingEntry ? { descripcion: editingEntry.descripcion, tipoActuacion: editingEntry.tipoActuacion || '' } : undefined}
                isEditing={!!editingEntry}
            />
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <BookText className="mr-2 h-6 w-6" /> Historial de Actuaciones
          </CardTitle>
          <CardDescription>
            {entradasBitacora.length > 0 
              ? `Mostrando ${entradasBitacora.length} entrada(s) para ${cliente.nombres} ${cliente.apellidos}.`
              : `No hay entradas en la bitácora para este cliente.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && entradasBitacora.length === 0 ? (
             <div className="text-center text-muted-foreground py-8">Cargando entradas...</div>
          ) : !isLoading && entradasBitacora.length === 0 && !error ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No hay entradas registradas en la bitácora para este cliente.</p>
              <p>Puede agregar una usando el botón de arriba.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {entradasBitacora.map((entrada) => (
                  <div key={entrada.id} className="p-4 border rounded-md shadow-sm bg-card hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(entrada.fechaEntrada)}
                        </p>
                        {entrada.tipoActuacion && (
                          <Badge variant="secondary" className="mt-1 text-xs">{entrada.tipoActuacion}</Badge>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenFormForEdit(entrada)} title="Editar Entrada">
                            <Edit3 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(entrada)} title="Eliminar Entrada">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{entrada.descripcion}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. ¿Está seguro que desea eliminar esta entrada de la bitácora?
                {entryToDelete && <div className="mt-2 text-sm border p-2 rounded-md bg-muted/50"><strong>Descripción:</strong> {entryToDelete.descripcion.substring(0,100)}{entryToDelete.descripcion.length > 100 ? '...' : ''}</div>}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setShowDeleteConfirm(false); setEntryToDelete(null);}}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
