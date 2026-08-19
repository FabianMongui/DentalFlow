import React, { useEffect, useRef, useState } from 'react';
import { Select } from './Select';
import { Combobox, type ComboboxOption } from './Combobox';
import { DatePicker } from './DatePicker';
import { useDentalFlow } from '../context/DentalFlowContext';
import { notifyError } from '../lib/notify';
import type { Appointment, AppointmentInput, AppointmentStatus } from '../types';

const statusOptions: AppointmentStatus[] = ['Programada', 'Confirmada', 'Completada', 'Cancelada', 'No asistió'];

const inputClass = 'w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all';
const selectClass = 'w-full h-12';
const labelClass = 'text-[10px] font-bold text-slate-400 uppercase ml-1';

interface LocalForm {
  patientName: string;
  patientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
  jobId: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

const splitISO = (iso: string) => {
  const date = new Date(iso);
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

const toISOFromLocal = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0).toISOString();
};

const timeOptions: string[] = [];
for (let hour = 6; hour <= 21; hour++) {
  for (let minute = 0; minute < 60; minute += 15) {
    if (hour === 21 && minute > 0) break;
    timeOptions.push(`${pad(hour)}:${pad(minute)}`);
  }
}

const formatTimeLabel = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const addMinutesClamped = (time: string, minutesToAdd: number) => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);
  const result = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return result > '21:00' ? '21:00' : result;
};

const nextHalfHour = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  now.setSeconds(0, 0);
  if (minutes < 30) {
    now.setMinutes(30);
  } else {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  }
  // keep the default suggestion inside typical business hours so a freshly
  // created appointment is always visible in the calendar's default time range
  if (now.getHours() < 7) {
    now.setHours(9, 0, 0, 0);
  } else if (now.getHours() >= 19) {
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
  }
  return now;
};

const buildInitialForm = (appointment?: Appointment, prefilledStart?: string, prefilledEnd?: string): LocalForm => {
  if (appointment) {
    const start = splitISO(appointment.startAt);
    const end = splitISO(appointment.endAt);
    return {
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone ?? '',
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      status: appointment.status,
      notes: appointment.notes ?? '',
      jobId: appointment.jobId ?? '',
    };
  }

  if (prefilledStart) {
    const start = splitISO(prefilledStart);
    const end = prefilledEnd ? splitISO(prefilledEnd) : null;
    return {
      patientName: '',
      patientPhone: '',
      date: start.date,
      startTime: start.time,
      endTime: end?.time ?? start.time,
      status: 'Programada',
      notes: '',
      jobId: '',
    };
  }

  const fallbackStart = nextHalfHour();
  const fallbackEnd = new Date(fallbackStart.getTime() + 30 * 60000);
  const start = splitISO(fallbackStart.toISOString());
  const end = splitISO(fallbackEnd.toISOString());
  return {
    patientName: '',
    patientPhone: '',
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    status: 'Programada',
    notes: '',
    jobId: '',
  };
};

interface AppointmentFormProps {
  appointment?: Appointment;
  clientId: string;
  prefilledStart?: string;
  prefilledEnd?: string;
  jobOptions: ComboboxOption[];
  onSuccess: (appointment: Appointment) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onCreateJob?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  submitLabel?: string;
  formId?: string;
}

export const AppointmentForm = ({
  appointment,
  clientId,
  prefilledStart,
  prefilledEnd,
  jobOptions,
  onSuccess,
  onCancel,
  onDelete,
  onCreateJob,
  onDirtyChange,
  submitLabel,
  formId = 'appointment-form',
}: AppointmentFormProps) => {
  const { createAppointment, updateAppointment } = useDentalFlow();
  const isEditing = Boolean(appointment);
  const initialFormRef = useRef<LocalForm>(buildInitialForm(appointment, prefilledStart, prefilledEnd));
  const [form, setForm] = useState<LocalForm>(initialFormRef.current);

  useEffect(() => {
    const dirty = JSON.stringify(form) !== JSON.stringify(initialFormRef.current);
    onDirtyChange?.(dirty);
    // onDirtyChange is a stable callback from the parent; only form changes should trigger this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const setField = <K extends keyof LocalForm>(key: K, value: LocalForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleStartTimeChange = (value: string) => {
    setForm((current) => ({ ...current, startTime: value, endTime: addMinutesClamped(value, 30) }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.patientName.trim()) {
      notifyError('Ingresa el nombre del paciente.');
      return;
    }

    if (!form.date || !form.startTime || !form.endTime) {
      notifyError('Completa la fecha y el horario de la cita.');
      return;
    }

    const startAt = toISOFromLocal(form.date, form.startTime);
    const endAt = toISOFromLocal(form.date, form.endTime);

    if (new Date(endAt) <= new Date(startAt)) {
      notifyError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const input: AppointmentInput = {
      clientId,
      patientName: form.patientName.trim(),
      patientPhone: form.patientPhone.trim() || undefined,
      startAt,
      endAt,
      status: form.status,
      notes: form.notes.trim() || undefined,
      jobId: form.jobId || undefined,
    };

    if (appointment) {
      updateAppointment(appointment.id, input);
      onSuccess({ ...appointment, ...input, updatedAt: new Date().toISOString() });
    } else {
      const created = createAppointment(input);
      onSuccess(created);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:col-span-2">
          <label className={labelClass}>Nombre del paciente</label>
          <input value={form.patientName} onChange={(event) => setField('patientName', event.target.value)} type="text" placeholder="Nombre completo" className={inputClass} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className={labelClass}>Teléfono</label>
          <input value={form.patientPhone} onChange={(event) => setField('patientPhone', event.target.value)} type="text" placeholder="+57 300 000 0000" className={inputClass} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className={labelClass}>Fecha</label>
          <DatePicker value={form.date} onChange={(value) => setField('date', value)} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Hora inicio</label>
          <Select value={form.startTime} onChange={(event) => handleStartTimeChange(event.target.value)} className={selectClass}>
            {timeOptions.map((time) => <option key={time} value={time}>{formatTimeLabel(time)}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Hora fin</label>
          <Select value={form.endTime} onChange={(event) => setField('endTime', event.target.value)} className={selectClass}>
            {timeOptions.map((time) => <option key={time} value={time}>{formatTimeLabel(time)}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Estado</label>
          <Select value={form.status} onChange={(event) => setField('status', event.target.value as AppointmentStatus)} className={selectClass}>
            {statusOptions.map((option) => <option key={option}>{option}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Trabajo vinculado (opcional)</label>
          <Combobox
            value={form.jobId}
            onChange={(value) => setField('jobId', value)}
            options={[{ value: '', label: 'Sin trabajo vinculado' }, ...jobOptions]}
            placeholder="Sin trabajo vinculado"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className={labelClass}>Notas</label>
          <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Motivo de la cita, indicaciones, aclaraciones..." rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none" />
        </div>
      </div>

      {onCreateJob && (
        <button
          type="button"
          onClick={onCreateJob}
          className="w-full h-11 bg-primary/5 text-primary font-bold rounded-2xl border border-primary/20 hover:bg-primary/10 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
        >
          Crear trabajo para este paciente
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="submit" className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all">
          {submitLabel ?? (isEditing ? 'Guardar cambios' : 'Crear cita')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 h-12 bg-slate-50 text-slate-500 font-bold rounded-2xl border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all">Cancelar</button>
        )}
        {onDelete && (
          <button type="button" onClick={onDelete} className="h-12 px-5 bg-red-50 text-red-500 font-bold rounded-2xl border border-red-100 hover:bg-red-100 active:scale-95 transition-all">Eliminar</button>
        )}
      </div>
    </form>
  );
};
