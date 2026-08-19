import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import { Odontogram } from './Odontogram';
import { Select } from './Select';
import { DatePicker } from './DatePicker';
import { Combobox } from './Combobox';
import { formatCurrency, formatDate } from './Common';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import { VITA_3D_MASTER_SHADES, getVitaShadeHex } from '../lib/vitaShades';
import { notifyError } from '../lib/notify';
import type { Job, JobInput, JobStatus, PatientSex, PaymentStatus } from '../types';

const today = new Date().toISOString().slice(0, 10);

const addDays = (dateStr: string, days: number) => {
  const date = new Date(`${dateStr || today}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const buildInitialForm = (overrides: Partial<JobInput> = {}): JobInput => ({
  category: 'Laboratorio',
  jobType: '',
  clientId: '',
  patientReference: '',
  patientPhone: '',
  patientAge: undefined,
  patientSex: undefined,
  description: '',
  entryDate: today,
  estimatedDeliveryDate: '',
  status: 'Recibido',
  paymentStatus: 'Pendiente',
  agreedValue: 0,
  paidValue: 0,
  material: '',
  color: '',
  selectedTeeth: [],
  ...overrides,
});

const jobToFormInput = (job: Job): JobInput => ({
  category: job.category,
  jobType: job.jobType,
  clientId: job.clientId,
  patientReference: job.patientReference,
  patientPhone: job.patientPhone ?? '',
  patientAge: job.patientAge,
  patientSex: job.patientSex,
  description: job.description,
  entryDate: job.entryDate,
  estimatedDeliveryDate: job.estimatedDeliveryDate,
  status: job.status,
  paymentStatus: job.paymentStatus,
  agreedValue: job.agreedValue,
  paidValue: job.paidValue,
  observations: job.observations,
  material: job.material ?? '',
  color: job.color ?? '',
  selectedTeeth: job.selectedTeeth ?? [],
  requestedLabId: job.requestedLabId,
});

const sexOptions: PatientSex[] = ['Femenino', 'Masculino', 'Otro'];

const inputClass = 'w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all';
const selectClass = 'w-full h-12';
const labelClass = 'text-[10px] font-bold text-slate-400 uppercase ml-1';
const readOnlyBoxClass = 'w-full h-12 bg-slate-100 border border-slate-100 rounded-xl px-4 flex items-center text-sm font-bold text-slate-600 truncate';

const SectionHeader = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      {description && <p className="text-xs text-slate-400">{description}</p>}
    </div>
  </div>
);

interface JobFormProps {
  job?: Job;
  initialLabId?: string;
  initialPatientReference?: string;
  initialPatientPhone?: string;
  onSuccess: (job: Job) => void;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onFormChange?: (form: JobInput) => void;
  submitLabel?: string;
  formId?: string;
  hideActions?: boolean;
}

export const JobForm = ({
  job,
  initialLabId,
  initialPatientReference,
  initialPatientPhone,
  onSuccess,
  onCancel,
  onDirtyChange,
  onFormChange,
  submitLabel,
  formId = 'job-form',
  hideActions = false,
}: JobFormProps) => {
  const { currentUser } = useAuth();
  const { clients, labDirectory, getClientById, createJob, updateJob, getPublicLabById } = useDentalFlow();
  const isEditing = Boolean(job);
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const initialFormRef = useRef<JobInput>(
    job ? jobToFormInput(job) : buildInitialForm({
      clientId: clients[0]?.id ?? '',
      requestedLabId: initialLabId,
      patientReference: initialPatientReference ?? '',
      patientPhone: initialPatientPhone ?? '',
    }),
  );
  const [form, setForm] = useState<JobInput>(initialFormRef.current);
  const selectedLab = getPublicLabById(form.requestedLabId);
  const selectedShadeHex = getVitaShadeHex(form.color);

  useEffect(() => {
    onFormChange?.(form);
    const dirty = JSON.stringify(form) !== JSON.stringify(initialFormRef.current);
    onDirtyChange?.(dirty);
    // onFormChange/onDirtyChange are stable callbacks from the parent; only form changes should trigger this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const setField = <K extends keyof JobInput>(key: K, value: JobInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleTooth = (tooth: string) => {
    setForm((current) => {
      const teeth = current.selectedTeeth ?? [];
      const next = teeth.includes(tooth) ? teeth.filter((item) => item !== tooth) : [...teeth, tooth];
      return { ...current, selectedTeeth: next };
    });
  };

  const handleLabChange = (labId: string) => {
    setForm((current) => ({
      ...current,
      requestedLabId: labId || undefined,
      serviceId: undefined,
      jobType: '',
      material: '',
      estimatedDeliveryDate: '',
      agreedValue: 0,
    }));
  };

  const handleServiceChange = (serviceId: string) => {
    setForm((current) => {
      const lab = getPublicLabById(current.requestedLabId);
      const service = lab?.services.find((item) => item.id === serviceId);
      if (!service) {
        return { ...current, serviceId: undefined, jobType: '', material: '', estimatedDeliveryDate: '', agreedValue: 0 };
      }
      return {
        ...current,
        serviceId: service.id,
        jobType: service.name,
        material: service.material,
        estimatedDeliveryDate: addDays(current.entryDate, service.turnaroundDays),
        agreedValue: service.price,
      };
    });
  };

  const handleEntryDateChange = (value: string) => {
    setForm((current) => {
      const lab = getPublicLabById(current.requestedLabId);
      const service = lab?.services.find((item) => item.id === current.serviceId);
      return {
        ...current,
        entryDate: value,
        estimatedDeliveryDate: service ? addDays(value, service.turnaroundDays) : current.estimatedDeliveryDate,
      };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.selectedTeeth || form.selectedTeeth.length === 0) {
      notifyError('Selecciona al menos un diente en el odontograma.');
      return;
    }

    if (!form.clientId || !form.patientReference.trim()) {
      notifyError('Completa el cliente y el nombre del paciente.');
      return;
    }

    if (!job && (!form.requestedLabId || !form.serviceId)) {
      notifyError('Selecciona el laboratorio y el servicio que vas a solicitar.');
      return;
    }

    if (!form.jobType || !form.estimatedDeliveryDate) {
      notifyError('Falta información del trabajo: tipo y fecha de entrega estimada.');
      return;
    }

    if (job) {
      updateJob(job.id, form);
      onSuccess({ ...job, ...form, updatedAt: new Date().toISOString() });
    } else {
      const createdJob = createJob(form);
      onSuccess(createdJob);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      {/* Odontograma */}
      <section className="space-y-3">
        <SectionHeader icon={Icons.Tag} title="Odontograma" description="Selecciona los dientes involucrados en el trabajo." />
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 sm:p-4">
          <Odontogram selectedTeeth={form.selectedTeeth ?? []} onToggleTooth={toggleTooth} />
        </div>
      </section>

      {/* Cliente y paciente */}
      <section className="space-y-3 pt-5 border-t border-slate-100">
        <SectionHeader
          icon={Icons.Clientes}
          title={isSuperAdmin ? 'Cliente y paciente' : 'Datos del paciente'}
          description={isSuperAdmin ? '¿Quién solicita el trabajo y para qué paciente es?' : '¿Para qué paciente es este trabajo?'}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isSuperAdmin && (
            <div className="space-y-1 sm:col-span-2">
              <label className={labelClass}>Cliente</label>
              <Combobox
                value={form.clientId}
                onChange={(value) => setField('clientId', value)}
                options={clients.map((client) => ({ value: client.id, label: client.name }))}
                placeholder="Busca un cliente..."
              />
            </div>
          )}
          <div className="space-y-1">
            <label className={labelClass}>Nombre de paciente</label>
            <input value={form.patientReference} onChange={(event) => setField('patientReference', event.target.value)} type="text" placeholder="Nombre completo" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Teléfono</label>
            <input value={form.patientPhone ?? ''} onChange={(event) => setField('patientPhone', event.target.value)} type="text" placeholder="+57 300 000 0000" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Edad</label>
            <input value={form.patientAge ?? ''} onChange={(event) => setField('patientAge', event.target.value ? Number(event.target.value) : undefined)} type="number" min="0" placeholder="Ej. 34" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Sexo</label>
            <Select value={form.patientSex ?? ''} onChange={(event) => setField('patientSex', event.target.value ? event.target.value as PatientSex : undefined)} className={selectClass}>
              <option value="">Selecciona...</option>
              {sexOptions.map((option) => <option key={option}>{option}</option>)}
            </Select>
          </div>
        </div>
      </section>

      {/* Trabajo */}
      <section className="space-y-3 pt-5 border-t border-slate-100">
        <SectionHeader icon={Icons.Trabajos} title="Trabajo" description="Elige el laboratorio y el servicio que vas a solicitar." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Laboratorio</label>
            <Combobox
              value={form.requestedLabId ?? ''}
              onChange={handleLabChange}
              options={[
                ...(!selectedLab && form.requestedLabId
                  ? [{ value: form.requestedLabId, label: getClientById(form.requestedLabId)?.name ?? 'Laboratorio' }]
                  : []),
                ...labDirectory.map((lab) => ({ value: lab.id, label: lab.name })),
              ]}
              placeholder="Busca un laboratorio..."
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Servicio</label>
            <Select value={form.serviceId ?? ''} onChange={(event) => handleServiceChange(event.target.value)} disabled={!selectedLab} className={selectClass}>
              <option value="">{selectedLab ? 'Selecciona...' : 'Elige primero un laboratorio'}</option>
              {(selectedLab?.services ?? []).map((service) => (
                <option key={service.id} value={service.id}>{service.name} · {formatCurrency(service.price)}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Tipo de trabajo</label>
            <p className={readOnlyBoxClass}>{form.jobType || 'Se define al elegir un servicio'}</p>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>{isEditing ? 'Estado' : 'Estado inicial'}</label>
            <Select value={form.status} onChange={(event) => setField('status', event.target.value as JobStatus)} className={selectClass}>
              {['Recibido', 'En proceso', 'En corrección', 'Finalizado', 'Entregado', 'Cancelado'].map((option) => <option key={option}>{option}</option>)}
            </Select>
          </div>
        </div>
      </section>

      {/* Material y color */}
      <section className="space-y-3 pt-5 border-t border-slate-100">
        <SectionHeader icon={Icons.Servicios} title="Material y color" description="Insumo principal (definido por el servicio) y tono acordado." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Material</label>
            <p className={readOnlyBoxClass}>{form.material || 'Se define al elegir un servicio'}</p>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Color (guía VITA 3D-Master)</label>
            <div className="flex items-center gap-2">
              <Select value={form.color} onChange={(event) => setField('color', event.target.value)} className={selectClass} wrapperClassName="flex-1">
                <option value="">Selecciona...</option>
                {VITA_3D_MASTER_SHADES.map((shade) => <option key={shade.code} value={shade.code}>{shade.code}</option>)}
              </Select>
              <span
                className="w-12 h-12 rounded-xl border border-slate-200 shrink-0"
                style={{ backgroundColor: selectedShadeHex ?? '#f1f5f9' }}
                aria-hidden="true"
                title={form.color ? `Vista previa aproximada de ${form.color}` : 'Sin tono seleccionado'}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Fechas y valor */}
      <section className="space-y-3 pt-5 border-t border-slate-100">
        <SectionHeader icon={Icons.Calendar} title="Fechas y valor" description="La entrega y el valor los define el laboratorio según el servicio elegido." />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Fecha ingreso</label>
            <DatePicker value={form.entryDate} onChange={handleEntryDateChange} />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Fecha entrega estimada</label>
            <p className={readOnlyBoxClass}>{form.estimatedDeliveryDate ? formatDate(form.estimatedDeliveryDate) : 'Se calcula al elegir un servicio'}</p>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Valor pactado</label>
            <p className={readOnlyBoxClass}>{form.agreedValue ? formatCurrency(form.agreedValue) : 'Se calcula al elegir un servicio'}</p>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Valor pagado al laboratorio</label>
            <input value={form.paidValue || ''} onChange={(event) => setField('paidValue', Number(event.target.value))} type="number" min="0" placeholder="0" className={inputClass} />
          </div>
          <div className="space-y-1 sm:col-span-2 md:col-span-4">
            <label className={labelClass}>Estado de pago</label>
            <Select value={form.paymentStatus} onChange={(event) => setField('paymentStatus', event.target.value as PaymentStatus)} className={selectClass}>
              {['Pendiente', 'Parcial', 'Pagado'].map((option) => <option key={option}>{option}</option>)}
            </Select>
          </div>
        </div>
      </section>

      {/* Descripción / instrucciones */}
      <section className="space-y-3 pt-5 border-t border-slate-100">
        <SectionHeader icon={Icons.File} title="Descripción / instrucciones" description="Especificaciones técnicas, alcance o aclaraciones del trabajo." />
        <textarea value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Especificaciones técnicas, piezas, alcance del trabajo, notas del cliente..." rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none" />
      </section>

      {!hideActions && (
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button type="submit" className="flex-1 h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all">
            {submitLabel ?? (isEditing ? 'Guardar cambios' : 'Guardar trabajo')}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="flex-1 h-14 bg-slate-50 text-slate-500 font-bold rounded-2xl border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all">Cancelar</button>
          )}
        </div>
      )}
    </form>
  );
};
