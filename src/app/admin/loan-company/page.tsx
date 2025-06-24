'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit2, Trash2, Landmark, DollarSign, RefreshCw, AlertCircleIcon, Eye } from 'lucide-react'; 
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LoanClientForm } from '@/components/forms/LoanClientForm';
// Import LoanClientFormData from actions
import type { LoanClientAndFirstApplicationFormData as LoanClientFormData, SanitizedClientePrestamoWithSolicitudes as ClienteConSolicitudes } from '@/actions/loan-actions';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { EstadoSolicitud, TipoGarantia } from '@prisma/client';
import {
  addLoanClientAndFirstApplicationAction,
  listLoanClientsWithApplicationsAction,
  updateLoanClientAndFirstApplicationAction,
  deleteLoanClientAction,
} from '@/actions/loan-actions';
import { updateLoanApplicationStatusAction } from '@/actions/loan-application-actions'; 
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';


export default function LoanCompanyPage() {
  const [clientesConSolicitudes, setClientesConSolicitudes] = useState<ClienteConSolicitudes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClientData, setEditingClientData] = useState<Partial<LoanClientFormData> | undefined>(undefined);
  const [editingClientId, setEditingClientId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const cargarClientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listLoanClientsWithApplicationsAction();
      if (result.success && result.clientesConSolicitudes) {
        setClientesConSolicitudes(result.clientesConSolicitudes);
      } else {
        const errorMessage = result.message || 'No se pudieron cargar los clientes de préstamo.';
        setError(errorMessage);
        toast({ title: 'Error al Cargar', description: errorMessage, variant: 'destructive' });
      }
    } catch (e: any) {
      const errorMessage = e.message || 'Ocurrió un error inesperado al cargar clientes de préstamo.';
      setError(errorMessage);
      toast({ title: 'Error Crítico', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const handleOpenForm = async (cliente?: ClienteConSolicitudes) => {
    if (cliente && cliente.id) {
        setEditingClientId(cliente.id);
        const solicitudMasReciente = cliente.solicitudes?.[0];
        const initialFormData: Partial<LoanClientFormData> = {
            name: cliente.nombres,
            lastName: cliente.apellidos,
            dni: cliente.dni,
            phone: cliente.telefono,
            email: cliente.correoElectronico,
            workplace: cliente.lugarTrabajo,
            workplaceAddress: cliente.direccionTrabajo || '',
            homeAddress: cliente.direccionCasa,
            rtn: cliente.rtn || '',
            loanAmount: solicitudMasReciente?.montoSolicitado ? Number(solicitudMasReciente.montoSolicitado) : 0,
            collateralType: solicitudMasReciente?.tipoGarantia as TipoGarantia, 
            collateralDescription: solicitudMasReciente?.descripcionGarantia || '',
            loanDate: solicitudMasReciente?.fechaSolicitud ? new Date(solicitudMasReciente.fechaSolicitud) : new Date(),
            paymentNotes: solicitudMasReciente?.notasDePago || '',
            loanTermMonths: solicitudMasReciente?.plazoMeses ?? undefined,
            interestRate: solicitudMasReciente?.tasaInteresAnual !== null && solicitudMasReciente?.tasaInteresAnual !== undefined ? Number(solicitudMasReciente.tasaInteresAnual) : undefined,
        };
        setEditingClientData(initialFormData);
    } else {
        setEditingClientId(undefined);
        setEditingClientData(undefined);
    }
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClientId(undefined);
    setEditingClientData(undefined);
  };

  const handleFormSubmit = async (data: LoanClientFormData) => {
    let result;
    if (editingClientId && editingClientData) {
      result = await updateLoanClientAndFirstApplicationAction(editingClientId, data);
    } else {
      result = await addLoanClientAndFirstApplicationAction(data);
    }

    if (result.success) {
      toast({ title: 'Éxito', description: result.message });
      await cargarClientes();
      handleCloseForm(); 
      return { success: true, message: result.message, cliente: result.cliente, solicitud: result.solicitud };
    } else {
      toast({ 
        title: 'Error al Guardar', 
        description: result.message || 'No se pudo procesar la solicitud.', 
        variant: 'destructive' 
      });
      return { success: false, message: result.message || 'Error desconocido' };
    }
  };
  
  const handleDeleteClient = async (cliente: ClienteConSolicitudes) => {
    if (!window.confirm(`¿Está seguro que desea eliminar a ${cliente.nombres} ${cliente.apellidos}?\nEsta acción también eliminará todas sus solicitudes de préstamo asociadas.`)) {
        return;
    }
    const result = await deleteLoanClientAction(cliente.id);
    if (result.success) {
      toast({ title: 'Cliente Eliminado', description: result.message });
      await cargarClientes();
    } else {
      toast({ title: 'Error al Eliminar', description: result.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (solicitudId: string, nuevoEstado: EstadoSolicitud) => {
    const result = await updateLoanApplicationStatusAction({ solicitudId, nuevoEstado });
    if (result.success) {
      toast({ title: 'Estado Actualizado', description: result.message });
      await cargarClientes(); 
    } else {
      toast({ title: 'Error al Cambiar Estado', description: result.message, variant: 'destructive' });
    }
  };
  
  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    const numAmount = Number(amount);
    return numAmount.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), "dd/MM/yyyy");
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

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold text-accent">Gestión de Clientes - Préstamos</h1>
            <p className="text-md text-foreground/80 mt-1">Administre la cartera de clientes de la empresa de préstamos.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={cargarClientes} variant="outline" disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Cargando...' : 'Recargar Lista'}
            </Button>
            <Dialog open={isFormOpen} onOpenChange={ (isOpen) => { if (!isOpen) handleCloseForm(); else setIsFormOpen(true); }}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenForm()} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md">
                    <PlusCircle className="mr-2 h-5 w-5" /> Agregar Nuevo Cliente y Solicitud
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                    <DialogTitle className="font-headline text-2xl text-primary flex items-center">
                        <Landmark className="mr-3 h-7 w-7 text-accent" />
                        {editingClientId ? 'Editar Cliente y Solicitud de Préstamo' : 'Nuevo Cliente y Solicitud de Préstamo'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingClientId ? 'Modifique los datos del cliente y su solicitud principal.' : 'Complete la información para registrar un nuevo cliente y su primera solicitud de préstamo.'}
                    </DialogDescription>
                    </DialogHeader>
                    <LoanClientForm 
                        onSubmitForm={handleFormSubmit} 
                        initialData={editingClientData}
                        isEditing={!!editingClientId}
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
          <CardTitle className="font-headline text-xl text-accent">Lista de Clientes de Préstamos</CardTitle>
          <CardDescription>Visualice y gestione los clientes de préstamos registrados y su solicitud más reciente.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && clientesConSolicitudes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Cargando clientes...</p>
          ) : !isLoading && clientesConSolicitudes.length === 0 && !error ? (
             <div className="text-center text-muted-foreground py-8">
                <p>No hay clientes de préstamos registrados.</p>
                <p>Agregue uno para comenzar.</p>
              </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Monto Sol.</TableHead>
                  <TableHead>Garantía</TableHead>
                  <TableHead>Plazo (m)</TableHead>
                  <TableHead>Tasa (%)</TableHead>
                  <TableHead>Estado Solicitud</TableHead>
                  <TableHead>Fecha Sol.</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesConSolicitudes.map((cliente) => {
                  const solicitudReciente = cliente.solicitudes && cliente.solicitudes.length > 0 ? cliente.solicitudes[0] : null;
                  return (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nombres} {cliente.apellidos}</TableCell>
                      <TableCell>{cliente.dni}</TableCell>
                      <TableCell>{formatCurrency(solicitudReciente?.montoSolicitado)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           {solicitudReciente?.tipoGarantia.replace(/_/g, ' ')}
                           {solicitudReciente?.descripcionGarantia && <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={solicitudReciente.descripcionGarantia}>{solicitudReciente.descripcionGarantia}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{solicitudReciente?.plazoMeses || 'N/A'}</TableCell>
                      <TableCell>{solicitudReciente?.tasaInteresAnual !== null && solicitudReciente?.tasaInteresAnual !== undefined ? `${Number(solicitudReciente.tasaInteresAnual)}%` : 'N/A'}</TableCell>
                      <TableCell>
                        {solicitudReciente && (
                             <Select
                                value={solicitudReciente.estado}
                                onValueChange={(value) => handleStatusChange(solicitudReciente.id, value as EstadoSolicitud)}
                                disabled={!solicitudReciente} 
                              >
                                <SelectTrigger className={cn("h-8 text-xs w-[180px]", getEstadoSolicitudBadgeClass(solicitudReciente.estado), !solicitudReciente && "opacity-50 cursor-not-allowed")}>
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
                        )}
                        {!solicitudReciente && <Badge variant="outline">Sin Solicitud</Badge>}
                      </TableCell>
                      <TableCell>{formatDate(solicitudReciente?.fechaSolicitud)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" asChild title="Ver Detalles del Cliente/Solicitud">
                           <Link href={`/admin/loan-company/client/${cliente.id}/application/${solicitudReciente?.id || 'new'}`}>
                            <Eye className="h-4 w-4 text-blue-500" />
                           </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(cliente)} title="Editar Cliente y Solicitud Principal">
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(cliente)} title="Eliminar Cliente y Solicitudes">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>


      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-accent flex items-center"><DollarSign className="mr-2 h-6 w-6"/> Resumen Financiero</CardTitle>
          <CardDescription>Visión general de la cartera de préstamos.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/30 rounded-md text-center">
                <p className="text-3xl font-bold text-accent">{isLoading ? '...' : clientesConSolicitudes.length}</p>
                <p className="text-sm text-muted-foreground">Total Clientes con Solicitudes</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-md text-center">
                <p className="text-3xl font-bold text-green-600">
                    {isLoading ? '...' : formatCurrency(
                        clientesConSolicitudes.reduce((totalCapital, cliente) => {
                            const capitalCliente = cliente.solicitudes.reduce((subtotalCliente, solicitud) => {
                                if (['APROBADO', 'DESEMBOLSADO', 'EN_PAGO'].includes(solicitud.estado)) {
                                    // Ensure montoAprobado and montoSolicitado are numbers here
                                    const montoAprobadoNum = solicitud.montoAprobado !== null && solicitud.montoAprobado !== undefined ? Number(solicitud.montoAprobado) : 0;
                                    const montoSolicitadoNum = solicitud.montoSolicitado !== null && solicitud.montoSolicitado !== undefined ? Number(solicitud.montoSolicitado) : 0;
                                    
                                    const monto = montoAprobadoNum > 0 
                                                ? montoAprobadoNum
                                                : montoSolicitadoNum;
                                    return subtotalCliente + monto;
                                }
                                return subtotalCliente;
                            }, 0);
                            return totalCapital + capitalCliente;
                        }, 0)
                    )}
                </p>
                <p className="text-sm text-muted-foreground">Capital en Préstamos Activos/Aprobados</p>
            </div>
             <div className="p-4 bg-secondary/30 rounded-md text-center">
                <p className="text-3xl font-bold text-red-600">{isLoading ? '...' : clientesConSolicitudes.filter(c => c.solicitudes.some(s => s.estado === 'INCUMPLIMIENTO')).length}</p>
                <p className="text-sm text-muted-foreground">Clientes con Solicitudes en Incumplimiento</p>
            </div>
        </CardContent>
      </Card>
     
    </div>
  );
}


