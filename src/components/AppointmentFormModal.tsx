import React, { useState } from 'react';
import { Modal } from './Modal';
import { AppointmentForm } from './AppointmentForm';
import type { ComboboxOption } from './Combobox';
import { useDentalFlow } from '../context/DentalFlowContext';
import { confirmDelete, confirmDiscard, notifySuccess } from '../lib/notify';
import type { Appointment } from '../types';

interface AppointmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  clientId: string;
  appointment?: Appointment;
  prefilledStart?: string;
  prefilledEnd?: string;
  jobOptions: ComboboxOption[];
  onCreateJob?: (appointment: Appointment) => void;
}

export const AppointmentFormModal = ({
  open,
  onClose,
  onSuccess,
  clientId,
  appointment,
  prefilledStart,
  prefilledEnd,
  jobOptions,
  onCreateJob,
}: AppointmentFormModalProps) => {
  const { deleteAppointment } = useDentalFlow();
  const [isDirty, setIsDirty] = useState(false);

  const requestClose = async () => {
    if (isDirty) {
      const confirmed = await confirmDiscard();
      if (!confirmed) return;
    }
    setIsDirty(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!appointment) return;
    const confirmed = await confirmDelete('¿Eliminar esta cita?', `La cita de "${appointment.patientName}" se eliminará permanentemente.`);
    if (!confirmed) return;
    deleteAppointment(appointment.id);
    notifySuccess('Cita eliminada');
    setIsDirty(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={requestClose} title={appointment ? 'Editar cita' : 'Nueva cita'} size="md">
      {open && (
        <AppointmentForm
          key={appointment?.id ?? prefilledStart ?? 'new'}
          appointment={appointment}
          clientId={clientId}
          prefilledStart={prefilledStart}
          prefilledEnd={prefilledEnd}
          jobOptions={jobOptions}
          onSuccess={(saved) => {
            setIsDirty(false);
            notifySuccess(appointment ? 'Cita actualizada' : 'Cita creada');
            onSuccess(saved);
          }}
          onCancel={requestClose}
          onDelete={appointment ? handleDelete : undefined}
          onCreateJob={appointment && onCreateJob ? () => onCreateJob(appointment) : undefined}
          onDirtyChange={setIsDirty}
          submitLabel={appointment ? 'Guardar cambios' : 'Crear cita'}
        />
      )}
    </Modal>
  );
};
