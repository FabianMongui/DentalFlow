import React, { useState } from 'react';
import { Modal } from './Modal';
import { JobForm } from './JobForm';
import { confirmDiscard } from '../lib/notify';
import type { Job } from '../types';

interface JobFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (job: Job) => void;
  initialLabId?: string;
  job?: Job;
}

export const JobFormModal = ({ open, onClose, onSuccess, initialLabId, job }: JobFormModalProps) => {
  const [isDirty, setIsDirty] = useState(false);

  const requestClose = async () => {
    if (isDirty) {
      const confirmed = await confirmDiscard();
      if (!confirmed) return;
    }
    setIsDirty(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={requestClose} title={job ? 'Editar trabajo' : 'Nuevo trabajo'} size="lg">
      {open && (
        <JobForm
          key={job?.id ?? initialLabId ?? 'new'}
          job={job}
          initialLabId={initialLabId}
          onSuccess={(savedJob) => {
            setIsDirty(false);
            onSuccess(savedJob);
          }}
          onCancel={requestClose}
          onDirtyChange={setIsDirty}
          submitLabel={job ? 'Guardar cambios' : 'Crear trabajo'}
        />
      )}
    </Modal>
  );
};
