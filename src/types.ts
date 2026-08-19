export type WorkCategory = 'Laboratorio' | 'Grill' | 'Otro';
export type JobStatus = 'Recibido' | 'En proceso' | 'En corrección' | 'Finalizado' | 'Entregado' | 'Cancelado';
export type PaymentStatus = 'Pendiente' | 'Parcial' | 'Pagado';
export type ClientType = 'Cliente individual' | 'Laboratorio';
export type CorrectionStatus = 'Pendiente' | 'Solucionada';
export type ClientPlan = 'Básico' | 'Pro' | 'Premium';
export type UserRole = 'super_admin' | 'client_admin';
export type PatientSex = 'Femenino' | 'Masculino' | 'Otro';
export type LabResponse = 'Pendiente' | 'Aceptado' | 'Rechazado';
export type AppointmentStatus = 'Programada' | 'Confirmada' | 'Completada' | 'Cancelada' | 'No asistió';

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  active: boolean;
  plan?: ClientPlan;
}

export interface Service {
  id: string;
  clientId: string;
  name: string;
  category: WorkCategory;
  material: string;
  price: number;
  turnaroundDays: number;
  active: boolean;
  description?: string;
}

export type ServiceInput = Omit<Service, 'id' | 'clientId'>;

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  clientId?: string;
}

export interface Correction {
  id: string;
  date: string;
  description: string;
  requestedBy: string;
  status: CorrectionStatus;
}

export interface StatusHistoryItem {
  id: string;
  status: JobStatus;
  date: string;
  comment?: string;
}

export interface Job {
  id: string;
  code: string;
  category: WorkCategory;
  jobType: string;
  clientId: string;
  patientReference: string;
  patientPhone?: string;
  patientAge?: number;
  patientSex?: PatientSex;
  description: string;
  entryDate: string;
  estimatedDeliveryDate: string;
  realDeliveryDate?: string;
  status: JobStatus;
  paymentStatus: PaymentStatus;
  agreedValue: number;
  paidValue: number;
  observations?: string;
  material?: string;
  color?: string;
  selectedTeeth?: string[];
  corrections: Correction[];
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
  requestedLabId?: string;
  serviceId?: string;
  labResponse?: LabResponse;
}

export interface JobInput {
  category: WorkCategory;
  jobType: string;
  clientId: string;
  patientReference: string;
  patientPhone?: string;
  patientAge?: number;
  patientSex?: PatientSex;
  description: string;
  entryDate: string;
  estimatedDeliveryDate: string;
  status: JobStatus;
  paymentStatus: PaymentStatus;
  agreedValue: number;
  paidValue: number;
  observations?: string;
  material?: string;
  color?: string;
  selectedTeeth?: string[];
  requestedLabId?: string;
  serviceId?: string;
}

export interface AppointmentInput {
  clientId: string;
  patientName: string;
  patientPhone?: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes?: string;
  jobId?: string;
}

export interface Appointment extends AppointmentInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
