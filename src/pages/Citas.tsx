import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import type { DateSelectArg, DatesSetArg, EventClickArg, EventContentArg, EventDropArg } from '@fullcalendar/core';
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import { Icons } from '../components/Icons';
import { Combobox } from '../components/Combobox';
import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { EmptyState, appointmentStatusColors } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import { useJobFormModal } from '../context/JobFormModalContext';
import { notifySuccess } from '../lib/notify';
import type { Appointment, AppointmentInput } from '../types';
import '../styles/calendar.css';

type CalendarView = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';

const viewOptions: Array<{ view: CalendarView; label: string }> = [
  { view: 'timeGridDay', label: 'Día' },
  { view: 'timeGridWeek', label: 'Semana' },
  { view: 'dayGridMonth', label: 'Mes' },
];

interface ModalState {
  mode: 'create' | 'edit' | null;
  appointment?: Appointment;
  prefilledStart?: string;
  prefilledEnd?: string;
}

const formatTimeRange = (start: Date | null, end: Date | null) => {
  if (!start) return '';
  const format = (date: Date) => date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  return end ? `${format(start)} - ${format(end)}` : format(start);
};

const appointmentToInput = (appointment: Appointment): AppointmentInput => ({
  clientId: appointment.clientId,
  patientName: appointment.patientName,
  patientPhone: appointment.patientPhone,
  startAt: appointment.startAt,
  endAt: appointment.endAt,
  status: appointment.status,
  notes: appointment.notes,
  jobId: appointment.jobId,
});

const Citas = () => {
  const { currentUser } = useAuth();
  const { clients, jobs, appointments, updateAppointment } = useDentalFlow();
  const { openCreateJob } = useJobFormModal();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const calendarRef = useRef<FullCalendar>(null);

  const dentists = useMemo(
    () => clients.filter((client) => client.type === 'Cliente individual' && client.active),
    [clients],
  );

  const [selectedDentistId, setSelectedDentistId] = useState('');
  const targetClientId = isSuperAdmin ? selectedDentistId : currentUser?.clientId ?? '';

  const [viewTitle, setViewTitle] = useState('');
  const [activeView, setActiveView] = useState<CalendarView>('timeGridWeek');
  const [modalState, setModalState] = useState<ModalState>({ mode: null });

  const appointmentsForCalendar = useMemo(
    () => appointments.filter((appointment) => appointment.clientId === targetClientId),
    [appointments, targetClientId],
  );

  const jobOptions = useMemo(
    () => jobs
      .filter((job) => job.clientId === targetClientId)
      .map((job) => ({ value: job.id, label: `${job.code} · ${job.patientReference}` })),
    [jobs, targetClientId],
  );

  const events = useMemo(() => appointmentsForCalendar.map((appointment) => ({
    id: appointment.id,
    title: appointment.patientName,
    start: appointment.startAt,
    end: appointment.endAt,
    backgroundColor: appointmentStatusColors[appointment.status].bg,
    textColor: appointmentStatusColors[appointment.status].text,
    borderColor: 'transparent',
    extendedProps: { appointment },
  })), [appointmentsForCalendar]);

  const openCreateModal = (prefilledStart?: string, prefilledEnd?: string) => {
    setModalState({ mode: 'create', prefilledStart, prefilledEnd });
  };

  const handleDateClick = (info: DateClickArg) => {
    const start = info.date;
    const end = new Date(start.getTime() + 30 * 60000);
    openCreateModal(start.toISOString(), end.toISOString());
  };

  const handleSelect = (info: DateSelectArg) => {
    openCreateModal(info.startStr, info.endStr);
    calendarRef.current?.getApi().unselect();
  };

  const handleEventClick = (info: EventClickArg) => {
    const appointment = info.event.extendedProps.appointment as Appointment;
    setModalState({ mode: 'edit', appointment });
  };

  const handleEventDrop = (info: EventDropArg) => {
    const appointment = info.event.extendedProps.appointment as Appointment;
    if (!info.event.start) return;
    updateAppointment(appointment.id, {
      ...appointmentToInput(appointment),
      startAt: info.event.start.toISOString(),
      endAt: (info.event.end ?? info.event.start).toISOString(),
    });
    notifySuccess('Cita reprogramada.');
  };

  const handleEventResize = (info: EventResizeDoneArg) => {
    const appointment = info.event.extendedProps.appointment as Appointment;
    if (!info.event.start) return;
    updateAppointment(appointment.id, {
      ...appointmentToInput(appointment),
      startAt: info.event.start.toISOString(),
      endAt: (info.event.end ?? info.event.start).toISOString(),
    });
    notifySuccess('Duración de la cita actualizada.');
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setViewTitle(arg.view.title);
    setActiveView(arg.view.type as CalendarView);
  };

  const renderEventContent = (arg: EventContentArg) => {
    const isMonth = arg.view.type === 'dayGridMonth';
    return (
      <div className="px-1.5 py-0.5 overflow-hidden">
        <p className="text-[11px] font-bold truncate">{arg.event.title}</p>
        {!isMonth && <p className="text-[10px] opacity-80 truncate">{formatTimeRange(arg.event.start, arg.event.end)}</p>}
      </div>
    );
  };

  const changeView = (view: CalendarView) => {
    calendarRef.current?.getApi().changeView(view);
  };

  const closeModal = () => setModalState({ mode: null });

  const handleCreateJobFromAppointment = (appointment: Appointment) => {
    closeModal();
    openCreateJob({ patientReference: appointment.patientName, patientPhone: appointment.patientPhone });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-outline-variant p-4 shadow-sm">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Odontólogo</label>
          <Combobox
            value={selectedDentistId}
            onChange={setSelectedDentistId}
            options={dentists.map((dentist) => ({ value: dentist.id, label: dentist.name }))}
            placeholder="Busca un odontólogo..."
            className="max-w-md"
          />
        </div>
      )}

      {!targetClientId ? (
        <EmptyState title="Selecciona un odontólogo" description="Elige un odontólogo para ver y gestionar su calendario de citas." />
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => calendarRef.current?.getApi().prev()} aria-label="Anterior" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors">
                  <Icons.ChevronLeft className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => calendarRef.current?.getApi().today()} className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Hoy
                </button>
                <button type="button" onClick={() => calendarRef.current?.getApi().next()} aria-label="Siguiente" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors">
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-slate-800 capitalize truncate">{viewTitle}</h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                {viewOptions.map((option) => (
                  <button
                    key={option.view}
                    type="button"
                    onClick={() => changeView(option.view)}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                      activeView === option.view ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="h-10 px-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Icons.Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva cita</span>
              </button>
            </div>
          </div>

          <div className="df-calendar h-[calc(100vh-250px)] min-h-[600px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              height="100%"
              firstDay={1}
              locale={esLocale}
              slotMinTime="06:00:00"
              slotMaxTime="21:00:00"
              slotDuration="00:30:00"
              allDaySlot={false}
              nowIndicator
              eventDisplay="block"
              selectable
              selectMirror
              editable
              dayMaxEvents={3}
              events={events}
              select={handleSelect}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              datesSet={handleDatesSet}
              eventContent={renderEventContent}
              eventDidMount={(info) => { info.el.setAttribute('title', info.event.title); }}
            />
          </div>
        </div>
      )}

      {targetClientId && (
        <AppointmentFormModal
          open={modalState.mode !== null}
          onClose={closeModal}
          clientId={targetClientId}
          appointment={modalState.appointment}
          prefilledStart={modalState.prefilledStart}
          prefilledEnd={modalState.prefilledEnd}
          jobOptions={jobOptions}
          onSuccess={() => {
            closeModal();
          }}
          onCreateJob={handleCreateJobFromAppointment}
        />
      )}
    </motion.div>
  );
};

export default Citas;
