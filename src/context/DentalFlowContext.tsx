import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mockClients, mockJobs, mockServices } from '../data/mockData';
import { useAuth } from './AuthContext';
import type { Client, Correction, Job, JobInput, JobStatus, LabResponse, PaymentStatus, Service, ServiceInput } from '../types';

export type LabDirectoryEntry = Client & { services: Service[] };

interface DentalFlowContextValue {
  jobs: Job[];
  clients: Client[];
  services: Service[];
  labDirectory: LabDirectoryEntry[];
  getJobById: (id?: string) => Job | undefined;
  getClientById: (id?: string) => Client | undefined;
  getPublicLabById: (id?: string) => LabDirectoryEntry | undefined;
  createJob: (input: JobInput) => Job;
  updateJob: (jobId: string, patch: JobInput) => void;
  updateJobStatus: (jobId: string, status: JobStatus, comment?: string) => void;
  respondToJobRequest: (jobId: string, response: Extract<LabResponse, 'Aceptado' | 'Rechazado'>) => void;
  updatePaymentStatus: (jobId: string, paymentStatus: PaymentStatus, paidValue?: number) => void;
  addCorrection: (jobId: string, correction: Omit<Correction, 'id'>) => void;
  createClientAccount: (input: Omit<Client, 'id'>) => Client;
  updateClientAccount: (clientId: string, patch: Partial<Omit<Client, 'id'>>) => void;
  createService: (input: ServiceInput, targetClientId?: string) => Service | undefined;
  updateService: (serviceId: string, patch: Partial<ServiceInput>) => void;
  deleteService: (serviceId: string) => void;
}

const DentalFlowContext = createContext<DentalFlowContextValue | null>(null);

const JOBS_KEY = 'dentalflow.jobs.v1';
const CLIENTS_KEY = 'dentalflow.clients.v1';
const SERVICES_KEY = 'dentalflow.services.v2';

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
const today = () => new Date().toISOString().slice(0, 10);

export const DentalFlowProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const [allJobs, setAllJobs] = useState<Job[]>(() => safeRead(JOBS_KEY, mockJobs));
  const [allClients, setAllClients] = useState<Client[]>(() => safeRead(CLIENTS_KEY, mockClients));
  const [allServices, setAllServices] = useState<Service[]>(() => safeRead(SERVICES_KEY, mockServices));

  useEffect(() => {
    window.localStorage.setItem(JOBS_KEY, JSON.stringify(allJobs));
  }, [allJobs]);

  useEffect(() => {
    window.localStorage.setItem(CLIENTS_KEY, JSON.stringify(allClients));
  }, [allClients]);

  useEffect(() => {
    window.localStorage.setItem(SERVICES_KEY, JSON.stringify(allServices));
  }, [allServices]);

  const clients = useMemo(() => {
    if (!currentUser || currentUser.role === 'super_admin') return allClients;
    return allClients.filter((client) => client.id === currentUser.clientId);
  }, [allClients, currentUser]);

  const jobs = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') return allJobs;
    return allJobs.filter((job) => job.clientId === currentUser.clientId || job.requestedLabId === currentUser.clientId);
  }, [allJobs, currentUser]);

  const services = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') return allServices;
    return allServices.filter((service) => service.clientId === currentUser.clientId);
  }, [allServices, currentUser]);

  const labDirectory = useMemo<LabDirectoryEntry[]>(() => (
    allClients
      .filter((client) => client.type === 'Laboratorio' && client.active)
      .map((client) => ({
        ...client,
        services: allServices.filter((service) => service.clientId === client.id && service.active),
      }))
  ), [allClients, allServices]);

  const value = useMemo<DentalFlowContextValue>(() => ({
    jobs,
    clients,
    services,
    labDirectory,
    getJobById: (id?: string) => jobs.find((job) => job.id === id || job.code === id),
    getClientById: (id?: string) => clients.find((client) => client.id === id),
    getPublicLabById: (id?: string) => labDirectory.find((lab) => lab.id === id),
    createJob: (input: JobInput) => {
      const now = new Date().toISOString();
      const nextNumber = allJobs.length + 8821;
      const clientId = currentUser?.role === 'client_admin' ? currentUser.clientId ?? input.clientId : input.clientId;
      const job: Job = {
        ...input,
        clientId,
        id: makeId('job'),
        code: `DF-${nextNumber}`,
        paidValue: Number(input.paidValue || 0),
        agreedValue: Number(input.agreedValue || 0),
        labResponse: input.requestedLabId ? 'Pendiente' : undefined,
        corrections: [],
        statusHistory: [
          { id: makeId('history'), status: input.status, date: today(), comment: 'Trabajo creado.' },
        ],
        createdAt: now,
        updatedAt: now,
      };

      setAllJobs((current) => [job, ...current]);
      return job;
    },
    updateJob: (jobId: string, patch: JobInput) => {
      setAllJobs((current) => current.map((job) => {
        if (job.id !== jobId) return job;
        if (currentUser?.role === 'client_admin' && job.clientId !== currentUser.clientId) return job;
        const clientId = currentUser?.role === 'client_admin' ? currentUser.clientId ?? patch.clientId : patch.clientId;
        return {
          ...job,
          ...patch,
          clientId,
          paidValue: Number(patch.paidValue || 0),
          agreedValue: Number(patch.agreedValue || 0),
          updatedAt: new Date().toISOString(),
        };
      }));
    },
    updateJobStatus: (jobId: string, status: JobStatus, comment?: string) => {
      setAllJobs((current) => current.map((job) => {
        if (job.id !== jobId) return job;
        if (currentUser?.role === 'client_admin' && job.clientId !== currentUser.clientId) return job;
        const deliveryDate = status === 'Entregado' && !job.realDeliveryDate ? today() : job.realDeliveryDate;
        return {
          ...job,
          status,
          realDeliveryDate: deliveryDate,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...job.statusHistory,
            { id: makeId('history'), status, date: today(), comment },
          ],
        };
      }));
    },
    respondToJobRequest: (jobId: string, response: Extract<LabResponse, 'Aceptado' | 'Rechazado'>) => {
      setAllJobs((current) => current.map((job) => {
        if (job.id !== jobId) return job;
        if (currentUser?.role === 'client_admin' && job.requestedLabId !== currentUser.clientId) return job;
        const nextStatus: JobStatus = response === 'Aceptado' ? 'En proceso' : 'Cancelado';
        const comment = response === 'Aceptado' ? 'Laboratorio aceptó el trabajo.' : 'Laboratorio rechazó el trabajo.';
        return {
          ...job,
          labResponse: response,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...job.statusHistory,
            { id: makeId('history'), status: nextStatus, date: today(), comment },
          ],
        };
      }));
    },
    updatePaymentStatus: (jobId: string, paymentStatus: PaymentStatus, paidValue?: number) => {
      setAllJobs((current) => current.map((job) => {
        if (job.id !== jobId) return job;
        if (currentUser?.role === 'client_admin' && job.clientId !== currentUser.clientId) return job;
        const nextPaidValue = paymentStatus === 'Pagado'
          ? job.agreedValue
          : typeof paidValue === 'number'
            ? paidValue
            : job.paidValue;

        return {
          ...job,
          paymentStatus,
          paidValue: nextPaidValue,
          updatedAt: new Date().toISOString(),
        };
      }));
    },
    addCorrection: (jobId: string, correction: Omit<Correction, 'id'>) => {
      setAllJobs((current) => current.map((job) => {
        if (job.id !== jobId) return job;
        if (currentUser?.role === 'client_admin' && job.clientId !== currentUser.clientId) return job;
        return {
          ...job,
          status: correction.status === 'Pendiente' ? 'En corrección' : job.status,
          corrections: [
            { ...correction, id: makeId('correction') },
            ...job.corrections,
          ],
          updatedAt: new Date().toISOString(),
          statusHistory: correction.status === 'Pendiente'
            ? [
                ...job.statusHistory,
                { id: makeId('history'), status: 'En corrección', date: correction.date, comment: correction.description },
              ]
            : job.statusHistory,
        };
      }));
    },
    createClientAccount: (input: Omit<Client, 'id'>) => {
      const account: Client = { ...input, id: makeId('cli') };
      setAllClients((current) => [account, ...current]);
      return account;
    },
    updateClientAccount: (clientId: string, patch: Partial<Omit<Client, 'id'>>) => {
      setAllClients((current) => current.map((client) => (
        client.id === clientId ? { ...client, ...patch } : client
      )));
    },
    createService: (input: ServiceInput, targetClientId?: string) => {
      const clientId = currentUser?.role === 'client_admin' ? currentUser.clientId : targetClientId;
      if (!clientId) return undefined;
      const service: Service = { ...input, id: makeId('svc'), clientId };
      setAllServices((current) => [service, ...current]);
      return service;
    },
    updateService: (serviceId: string, patch: Partial<ServiceInput>) => {
      setAllServices((current) => current.map((service) => {
        if (service.id !== serviceId) return service;
        if (currentUser?.role === 'client_admin' && service.clientId !== currentUser.clientId) return service;
        return { ...service, ...patch };
      }));
    },
    deleteService: (serviceId: string) => {
      setAllServices((current) => current.filter((service) => {
        if (service.id !== serviceId) return true;
        if (currentUser?.role === 'client_admin' && service.clientId !== currentUser.clientId) return true;
        return false;
      }));
    },
  }), [jobs, clients, services, labDirectory, allJobs, currentUser]);

  return (
    <DentalFlowContext.Provider value={value}>
      {children}
    </DentalFlowContext.Provider>
  );
};

export const useDentalFlow = () => {
  const context = useContext(DentalFlowContext);
  if (!context) {
    throw new Error('useDentalFlow debe usarse dentro de DentalFlowProvider');
  }

  return context;
};
