import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { motion } from 'motion/react';
import { useDentalFlow } from '../context/DentalFlowContext';
import type { JobInput, JobStatus, PaymentStatus, WorkCategory } from '../types';

const today = new Date().toISOString().slice(0, 10);

const initialForm: JobInput = {
  category: 'Laboratorio',
  jobType: '',
  clientId: '',
  patientReference: '',
  description: '',
  entryDate: today,
  estimatedDeliveryDate: '',
  status: 'Recibido',
  paymentStatus: 'Pendiente',
  agreedValue: 0,
  paidValue: 0,
  observations: '',
};

const CreateJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients, createJob, getPublicLabById } = useDentalFlow();
  const preselectedLabId = searchParams.get('labId') ?? undefined;
  const [form, setForm] = useState<JobInput>({ ...initialForm, clientId: clients[0]?.id ?? '', requestedLabId: preselectedLabId });
  const [error, setError] = useState('');
  const requestedLab = getPublicLabById(form.requestedLabId);

  const setField = <K extends keyof JobInput>(key: K, value: JobInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.jobType.trim() || !form.clientId || !form.patientReference.trim() || !form.estimatedDeliveryDate) {
      setError('Completa tipo de trabajo, cliente, paciente/referencia y fecha de entrega.');
      return;
    }

    const createdJob = createJob(form);
    navigate(`/trabajos/${createdJob.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl border border-outline-variant shadow-sm space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { id: 'Laboratorio', label: 'Laboratorio', icon: Icons.Dashboard },
                { id: 'Grill', label: 'Grill', icon: Icons.MoreVertical },
                { id: 'Otro', label: 'Otro', icon: Icons.Plus },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setField('category', cat.id as WorkCategory)}
                  className={`flex sm:flex-col items-center justify-center gap-3 sm:gap-0 p-4 sm:p-6 rounded-2xl border-2 transition-all group ${
                    form.category === cat.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <cat.icon className={`w-6 h-6 sm:mb-2 ${form.category === cat.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                  <span className={`text-[10px] font-bold uppercase ${form.category === cat.id ? 'text-primary' : 'text-slate-400'}`}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex gap-3">
              <Icons.Alert className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {requestedLab && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-primary text-sm font-medium flex items-center gap-3">
              <Icons.Laboratorios className="w-5 h-5 shrink-0" />
              Laboratorio solicitado: <strong>{requestedLab.name}</strong>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de trabajo</label>
              <input value={form.jobType} onChange={(event) => setField('jobType', event.target.value)} type="text" placeholder="Ej. Corona de Zirconio" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente / laboratorio</label>
              <select value={form.clientId} onChange={(event) => setField('clientId', event.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Paciente o referencia</label>
              <input value={form.patientReference} onChange={(event) => setField('patientReference', event.target.value)} type="text" placeholder="Nombre, iniciales o referencia interna" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción / instrucciones</label>
              <textarea value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Especificaciones técnicas, color, piezas, material, etc." rows={4} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha ingreso</label>
              <input value={form.entryDate} onChange={(event) => setField('entryDate', event.target.value)} type="date" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha entrega</label>
              <input value={form.estimatedDeliveryDate} onChange={(event) => setField('estimatedDeliveryDate', event.target.value)} type="date" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor pactado</label>
              <input value={form.agreedValue || ''} onChange={(event) => setField('agreedValue', Number(event.target.value))} type="number" min="0" placeholder="0" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor pagado</label>
              <input value={form.paidValue || ''} onChange={(event) => setField('paidValue', Number(event.target.value))} type="number" min="0" placeholder="0" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado inicial</label>
              <select value={form.status} onChange={(event) => setField('status', event.target.value as JobStatus)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                {['Recibido', 'En proceso', 'En corrección', 'Finalizado', 'Entregado', 'Cancelado'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado pago</label>
              <select value={form.paymentStatus} onChange={(event) => setField('paymentStatus', event.target.value as PaymentStatus)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                {['Pendiente', 'Parcial', 'Pagado'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Observaciones</label>
              <textarea value={form.observations} onChange={(event) => setField('observations', event.target.value)} placeholder="Notas internas o aclaraciones del cliente" rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button type="submit" className="flex-1 h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all">Guardar trabajo</button>
            <button type="button" onClick={() => navigate('/trabajos')} className="flex-1 h-14 bg-slate-50 text-slate-500 font-bold rounded-2xl border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all">Cancelar</button>
          </div>
        </form>
      </div>

      <aside className="space-y-6 lg:space-y-8">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-6">
          <h3 className="font-bold text-lg">Flujo simple</h3>
          <div className="relative pl-6 space-y-6 border-l-2 border-slate-100 py-2">
            {[
              { label: 'Recibido', desc: 'Ingreso del trabajo', active: true, icon: Icons.Check },
              { label: 'En proceso', desc: 'Producción', active: form.status !== 'Recibido', icon: Icons.Dashboard },
              { label: 'Entregado', desc: 'Cierre', active: form.status === 'Entregado', icon: Icons.Truck },
            ].map((step, idx) => (
              <div key={idx} className={`relative group ${step.active ? '' : 'opacity-40'}`}>
                <div className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${
                  step.active ? 'bg-secondary text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-300 group-hover:border-primary'
                }`}>
                  <step.icon className="w-3.5 h-3.5 font-bold" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{step.label}</h4>
                  <p className="text-[10px] font-bold uppercase text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="h-28 sm:h-32 bg-primary relative flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:16px_16px]" />
            <Icons.Dashboard className="w-12 h-12 text-white/40" />
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <h4 className="font-bold">Resumen rápido</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Al guardar se crea un código único y el trabajo queda disponible en el listado, dashboard y detalle.</p>
            <div className="flex justify-between items-center py-2 border-b border-slate-50 gap-3">
              <span className="text-xs text-slate-400">Categoría</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-secondary/10 text-secondary rounded">{form.category}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50 gap-3">
              <span className="text-xs text-slate-400">Estado</span>
              <span className="text-xs font-bold text-right">{form.status}</span>
            </div>
          </div>
        </div>
      </aside>
    </motion.div>
  );
};

export default CreateJob;
