// src/components/forms/ClientIntakeForm.tsx
'use client';
import React from 'react'; // Keep React

export type DatosClienteInicial = {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correoElectronico: string;
  lugarTrabajo: string;
  tipoCaso: string;
};
export interface ClientDataForCalendar extends DatosClienteInicial {
  clienteBufeteId?: string;
}
interface ClientIntakeFormProps {
    onSubmitSuccess?: (data: ClientDataForCalendar) => void;
}

export function ClientIntakeForm({ onSubmitSuccess }: ClientIntakeFormProps) {
  // This component's functionality has been removed.
  if (process.env.NODE_ENV === 'development') {
    console.warn('ClientIntakeForm component functionality has been removed.');
  }
  // If onSubmitSuccess was expected to be called, consider if a mock call or specific handling is needed
  // For now, just returning null as the form itself is not part of the book-appointment page anymore.
  return null;
}
