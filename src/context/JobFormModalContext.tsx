import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobFormModal } from '../components/JobFormModal';
import type { Job } from '../types';

interface OpenCreateJobOptions {
  labId?: string;
  patientReference?: string;
  patientPhone?: string;
}

interface JobFormModalContextValue {
  openCreateJob: (options?: OpenCreateJobOptions) => void;
}

const JobFormModalContext = createContext<JobFormModalContextValue | null>(null);

export const JobFormModalProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [labId, setLabId] = useState<string | undefined>(undefined);
  const [initialPatient, setInitialPatient] = useState<{ reference?: string; phone?: string }>({});

  const openCreateJob = (options?: OpenCreateJobOptions) => {
    setLabId(options?.labId);
    setInitialPatient({ reference: options?.patientReference, phone: options?.patientPhone });
    setIsOpen(true);
  };

  const handleSuccess = (job: Job) => {
    setIsOpen(false);
    navigate(`/trabajos/${job.id}`);
  };

  return (
    <JobFormModalContext.Provider value={{ openCreateJob }}>
      {children}
      <JobFormModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        initialLabId={labId}
        initialPatientReference={initialPatient.reference}
        initialPatientPhone={initialPatient.phone}
      />
    </JobFormModalContext.Provider>
  );
};

export const useJobFormModal = () => {
  const context = useContext(JobFormModalContext);
  if (!context) {
    throw new Error('useJobFormModal debe usarse dentro de JobFormModalProvider');
  }

  return context;
};
