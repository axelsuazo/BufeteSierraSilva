
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit2, Trash2, FileText, BarChart3, RefreshCw, AlertCircleIcon, CheckSquare, Clock, Archive } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LawFirmClientForm, type LawFirmClientFormData } from '@/components/forms/LawFirmClientForm';
import type { ClienteBufete as PrismaClienteBufete } from '@prisma/client';
import { 
  agregarClienteBufeteAccion, 
  listarClientesBufeteAccion,
  actualizarClienteBufeteAccion, // Usado por el formulario de edición completo
  actualizarEstadoClienteBufeteAccion, // Nueva acción para cambio rápido de estado
  eliminarClienteBufeteAccion,
  obtenerClienteBufetePorIdAccion
} from '@/actions/lawfirm-client-actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Definir los estados permitidos para el Select
const ESTADOS_CLIENTE_BUFETE = ["Consulta", "Activo", "Pendiente", "Finalizado", "Archivado"];

export default function LawFirmPage() {
  const [clientes, setClientes] = useState<PrismaClienteBufete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<PrismaClienteBufete | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const cargarClientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listarClientesBufeteAccion();
      if (result.success && result.clientes) {
        setClientes(result.clientes);
      } else {
        const errorMessage = result.message || 'No se pudieron cargar los clientes.';
        setError(errorMessage);
        toast({ title: 'Error al Cargar', description: errorMessage, variant: 'destructive' });
      }
    } catch (e: any) {
        const errorMessage = e.message || 'Ocurrió un error inesperado al cargar clientes.';
        setError(errorMessage);
        toast({ title: 'Error Crítico', description: errorMessage, variant: 'destructive' });
        console.error("Error crítico al cargar clientes:", e);
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const handleOpenForm = async (cliente?: PrismaClienteBufete) => {
    if (cliente) {
      setIsLoading(true); 
      const result = await obtenerClienteBufetePorIdAccion(cliente.id);
      setIsLoading(false);
      if (result.success && result.cliente) {
        setEditingClient(result.cliente);
      } else {
        toast({ title: 'Error', description: result.message || `No se pudo cargar el cliente para editar.`, variant: 'destructive' });
        setEditingClient(undefined); 
        return; 
      }
    } else {
      setEditingClient(undefined); 
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: LawFirmClientFormData): Promise<{ success: boolean }> => {
    let result;
    const dataToSubmit: Partial<PrismaClienteBufete> & LawFirmClientFormData = {
        ...data
    };
    
    if (editingClient) {
      result = await actualizarClienteBufeteAccion(editingClient.id, dataToSubmit);
    } else {
      result = await agregarClienteBufeteAccion(dataToSubmit);
    }

    if (result.success && result.cliente) {
      toast({ title: 'Éxito', description: result.message });
      setIsFormOpen(false);
      setEditingClient(undefined); 
      await cargarClientes(); 
      return { success: true };
    } else {
      toast({ 
        title: 'Error al Guardar', 
        description: result.message || 'No se pudo guardar el cliente.', 
        variant: 'destructive' 
      });
      if (result.errors) {
        console.error("Errores de validación:", result.errors);
      }
      return { success: false }; 
    }
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(undefined); 
  };

  const handleDeleteClient = async (cliente: PrismaClienteBufete) => {
    if (!window.confirm(`¿Está seguro que desea eliminar a ${cliente.nombres} ${cliente.apellidos}?\nEsta acción también eliminará los casos legales y bitácoras asociadas.`)) {
        return;
    }
    const result = await eliminarClienteBufeteAccion(cliente.id);
    if (result.success) {
      toast({ title: 'Cliente Eliminado', description: result.message });
      await cargarClientes(); 
    } else {
      toast({ title: 'Error al Eliminar', description: result.message, variant: 'destructive' });
    }
  };

  const handleEstadoChange = async (clienteId: string, nuevoEstado: string) => {
    const result = await actualizarEstadoClienteBufeteAccion(clienteId, nuevoEstado);
    if (result.success && result.cliente) {
      toast({ title: 'Estado Actualizado', description: result.message });
      // Actualizar el estado localmente para reflejar el cambio inmediatamente
      setClientes(prevClientes => 
        prevClientes.map(c => c.id === clienteId ? { ...c, estado: result.cliente!.estado } : c)
      );
    } else {
      toast({ title: 'Error al Actualizar Estado', description: result.message, variant: 'destructive' });
    }
  };
  
  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'bg-green-500/90 text-white hover:bg-green-600/90';
      case 'Consulta': return 'bg-blue-500/90 text-white hover:bg-blue-600/90';
      case 'Pendiente': return 'bg-yellow-500/90 text-black hover:bg-yellow-600/90';
      case 'Finalizado': return 'bg-gray-700/90 text-white hover:bg-gray-800/90';
      case 'Archivado': return 'bg-indigo-500/90 text-white hover:bg-indigo-600/90';
      default: return 'bg-gray-400/90 text-black hover:bg-gray-500/90';
    }
  };


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold text-primary">Gestión de Clientes - Bufete</h1>
            <p className="text-md text-foreground/80 mt-1">Administre los clientes y casos del bufete de abogados.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={cargarClientes} variant="outline" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Cargando...' : 'Recargar Lista'}
          </Button>
          <Dialog open={isFormOpen} onOpenChange={ (isOpen) => { if (!isOpen) handleCloseForm(); else setIsFormOpen(true); }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md">
                <PlusCircle className="mr-2 h-5 w-5" /> Agregar Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl text-primary">
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente del Bufete'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Modifique los datos del cliente.' : 'Complete la información para registrar un nuevo cliente.'}
                </DialogDescription>
              </DialogHeader>
              <LawFirmClientForm 
                  onSubmitForm={handleFormSubmit} 
                  initialData={editingClient ? { 
                    name: editingClient.nombres,
                    lastName: editingClient.apellidos,
                    email: editingClient.correoElectronico,
                    phone: editingClient.telefono || '',
                    dni: editingClient.dni || '',
                    workplace: editingClient.lugarTrabajo || '',
                    caseType: editingClient.tipoCaso,
                    // No pasamos 'estado' aquí, se maneja por separado o podría incluirse en el form si se quiere editar allí también
                  } : undefined}
                  isEditing={!!editingClient}
                  onClose={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">Lista de Clientes</CardTitle>
          <CardDescription>Visualice y gestione los clientes registrados en la base de datos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && clientes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Cargando clientes...</p>
          ) : !isLoading && clientes.length === 0 && !error ? (
             <div className="text-center text-muted-foreground py-8">
                <p>No hay clientes registrados.</p>
                <p>Agregue uno para comenzar.</p>
              </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo de Caso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nombres} {cliente.apellidos}</TableCell>
                    <TableCell>{cliente.correoElectronico}</TableCell>
                    <TableCell>{cliente.tipoCaso}</TableCell>
                    <TableCell>
                      <Select
                        value={cliente.estado}
                        onValueChange={(nuevoEstado) => handleEstadoChange(cliente.id, nuevoEstado)}
                      >
                        <SelectTrigger className={cn("h-9 text-xs w-[150px] font-medium", getEstadoBadgeClass(cliente.estado))}>
                          <SelectValue placeholder="Cambiar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_CLIENTE_BUFETE.map(estadoOpt => (
                            <SelectItem key={estadoOpt} value={estadoOpt} className="text-xs">
                              {estadoOpt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild title="Bitácora/Casos del Cliente">
                        <Link href={`/admin/law-firm/${cliente.id}/log`}>
                            <FileText className="h-4 w-4 text-primary" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(cliente)} title="Editar Cliente">
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(cliente)} title="Eliminar Cliente">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center"><BarChart3 className="mr-2 h-6 w-6" /> Estadísticas Rápidas</CardTitle>
          <CardDescription>Resumen general de la actividad del bufete.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/30 rounded-md text-center">
                <p className="text-3xl font-bold text-primary">{isLoading ? '...' : clientes.length}</p>
                <p className="text-sm text-muted-foreground">Clientes Totales</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-md text-center">
                <p className="text-3xl font-bold text-green-600">{isLoading ? '...' : clientes.filter(c => c.estado === 'Activo').length}</p>
                <p className="text-sm text-muted-foreground">Clientes Activos</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-md text-center">
                <p className="text-3xl font-bold text-blue-600">{isLoading ? '...' : clientes.filter(c => c.estado === 'Consulta').length}</p>
                <p className="text-sm text-muted-foreground">Consultas Iniciales</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
