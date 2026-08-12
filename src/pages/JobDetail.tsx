import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PaymentBadge, StatusBadge, formatCurrency, formatDate } from '../components/Common';
import { Odontogram } from '../components/Odontogram';
import { JobFormModal } from '../components/JobFormModal';
import { Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import { getVitaShadeHex } from '../lib/vitaShades';
import type { CorrectionStatus, JobStatus, PaymentStatus } from '../types';

const statusOptions: JobStatus[] = ['Recibido', 'En proceso', 'En corrección', 'Finalizado', 'Entregado', 'Cancelado'];
const paymentOptions: PaymentStatus[] = ['Pendiente', 'Parcial', 'Pagado'];

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getJobById, getClientById, getPublicLabById, updateJobStatus, updatePaymentStatus, addCorrection } = useDentalFlow();
  const job = getJobById(id);
  const client = getClientById(job?.clientId);
  const requestedLab = getPublicLabById(job?.requestedLabId);
  const requestedService = requestedLab?.services.find((service) => service.id === job?.serviceId);
  const canEdit = currentUser?.role === 'super_admin';
  const [correctionDescription, setCorrectionDescription] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<CorrectionStatus>('Pendiente');
  const [editOpen, setEditOpen] = useState(false);

  if (!job) {
    return (
      <div className="bg-white border border-outline-variant rounded-2xl p-8 text-center shadow-sm">
        <Icons.Alert className="w-10 h-10 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Trabajo no encontrado</h2>
        <p className="text-sm text-slate-500 mt-2">Puede que el código no exista o que haya sido eliminado.</p>
        <Link to="/trabajos" className="inline-flex mt-6 h-11 px-5 bg-primary text-white rounded-xl font-bold items-center justify-center">
          Volver a trabajos
        </Link>
      </div>
    );
  }

  const handleAddCorrection = (event: React.FormEvent) => {
    event.preventDefault();
    if (!correctionDescription.trim()) return;

    addCorrection(job.id, {
      date: new Date().toISOString().slice(0, 10),
      description: correctionDescription,
      requestedBy: requestedBy.trim() || client?.name || 'Cliente',
      status: correctionStatus,
    });

    setCorrectionDescription('');
    setRequestedBy('');
    setCorrectionStatus('Pendiente');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 sm:space-y-8 pb-20 lg:pb-0"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary font-bold text-sm mb-4 hover:underline"
          >
            <Icons.Back className="w-4 h-4" />
            Volver a trabajos
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">TRABAJO {job.code}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 truncate">{job.jobType}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={job.status} />
            <PaymentBadge status={job.paymentStatus} />
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase">{job.category}</span>
          </div>
        </div>
        <div className="flex items-start gap-4 shrink-0">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor total</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{formatCurrency(job.agreedValue)}</p>
            <p className="text-xs text-slate-400">Pagado: {formatCurrency(job.paidValue)}</p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="h-11 px-4 bg-white border border-outline-variant text-slate-600 hover:border-primary hover:text-primary rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shrink-0"
            >
              <Icons.Edit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      <JobFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        job={job}
        onSuccess={() => setEditOpen(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <Icons.File className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Detalles del trabajo</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cliente / laboratorio</label>
                <p className="font-bold text-slate-700">{client?.name}</p>
                <p className="text-xs text-slate-400">{client?.phone}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre de paciente</label>
                <p className="font-bold text-slate-700">{job.patientReference}</p>
                {(job.patientPhone || job.patientAge || job.patientSex) && (
                  <p className="text-xs text-slate-400">
                    {[job.patientPhone, job.patientAge ? `${job.patientAge} años` : undefined, job.patientSex].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha ingreso</label>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Icons.Calendar className="w-4 h-4" />
                  <span>{formatDate(job.entryDate)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Entrega estimada</label>
                <div className="flex items-center gap-2 text-primary text-sm font-bold">
                  <Icons.Check className="w-4 h-4" />
                  <span>{formatDate(job.estimatedDeliveryDate)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Entrega real</label>
                <p className="text-sm text-slate-600 font-medium">{formatDate(job.realDeliveryDate)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Saldo pendiente</label>
                <p className="text-sm font-bold text-red-500">{formatCurrency(Math.max(job.agreedValue - job.paidValue, 0))}</p>
              </div>
              {requestedLab && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Laboratorio</label>
                  <p className="font-bold text-slate-700">{requestedLab.name}</p>
                  {requestedService && <p className="text-xs text-slate-400">{requestedService.name}</p>}
                </div>
              )}
              {job.material && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Material</label>
                  <p className="text-sm font-medium text-slate-600">{job.material}</p>
                </div>
              )}
              {job.color && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Color (VITA 3D-Master)</label>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: getVitaShadeHex(job.color) ?? '#f1f5f9' }} aria-hidden="true" />
                    <p className="text-sm font-medium text-slate-600">{job.color}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-slate-50 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Descripción técnica</label>
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 leading-relaxed italic">
                  {job.description || 'Sin descripción registrada.'}
                </div>
              </div>
              {job.observations && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Observaciones</label>
                  <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 leading-relaxed">
                    {job.observations}
                  </div>
                </div>
              )}
            </div>
          </div>

          {job.selectedTeeth && job.selectedTeeth.length > 0 && (
            <div className="bg-white border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
                <Icons.Tag className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Odontograma</h3>
              </div>
              <Odontogram selectedTeeth={job.selectedTeeth} readOnly />
            </div>
          )}

          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Icons.Alert className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg text-slate-800">Correcciones y ajustes</h3>
              </div>
            </div>

            <form onSubmit={handleAddCorrection} className="p-4 sm:p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={correctionDescription}
                onChange={(event) => setCorrectionDescription(event.target.value)}
                placeholder="Descripción de la corrección"
                className="md:col-span-2 h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              />
              <input
                value={requestedBy}
                onChange={(event) => setRequestedBy(event.target.value)}
                placeholder="Solicitado por"
                className="h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              />
              <div className="flex gap-2">
                <Select value={correctionStatus} onChange={(event) => setCorrectionStatus(event.target.value as CorrectionStatus)} className="w-full h-11 text-sm" wrapperClassName="min-w-0 flex-1">
                  <option>Pendiente</option>
                  <option>Solucionada</option>
                </Select>
                <button className="h-11 px-4 bg-primary text-white rounded-xl font-bold text-sm active:scale-95 transition-all">Agregar</button>
              </div>
            </form>

            {job.corrections.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">Este trabajo no tiene correcciones registradas.</div>
            ) : (
              <div className="divide-y divide-slate-100 md:hidden">
                {job.corrections.map((correction) => (
                  <article key={correction.id} className="p-4 space-y-2">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-bold text-slate-700">{formatDate(correction.date)}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${correction.status === 'Solucionada' ? 'bg-secondary/10 text-secondary' : 'bg-red-100 text-red-600'}`}>{correction.status}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{correction.description}</p>
                    <p className="text-xs text-slate-400">Solicitado por: {correction.requestedBy}</p>
                  </article>
                ))}
              </div>
            )}

            {job.corrections.length > 0 && (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Incidencia</th>
                      <th className="px-6 py-3">Solicitado por</th>
                      <th className="px-6 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {job.corrections.map((correction) => (
                      <tr key={correction.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{formatDate(correction.date)}</td>
                        <td className="px-6 py-4 text-slate-700 max-w-xs">{correction.description}</td>
                        <td className="px-6 py-4 text-slate-600">{correction.requestedBy}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${correction.status === 'Solucionada' ? 'bg-secondary/10 text-secondary' : 'bg-red-100 text-red-600'}`}>{correction.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-lg border-b border-slate-50 pb-4">Acciones rápidas</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {statusOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateJobStatus(job.id, option, `Estado cambiado a ${option}.`)}
                  disabled={job.status === option}
                  className={`h-11 px-4 rounded-xl font-bold text-sm border transition-all active:scale-95 ${job.status === option ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-outline-variant hover:border-primary hover:text-primary'}`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-50 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Estado de pago</label>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                {paymentOptions.map((option) => (
                  <button key={option} onClick={() => updatePaymentStatus(job.id, option)} className={`h-10 rounded-xl font-bold text-xs border active:scale-95 transition-all ${job.paymentStatus === option ? 'bg-secondary text-white border-secondary' : 'bg-white text-slate-500 border-outline-variant'}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-lg border-b border-slate-50 pb-4">Historial</h3>
            <div className="relative pl-6 space-y-6 border-l-2 border-slate-100">
              {[...job.statusHistory].reverse().map((item, index) => (
                <div key={item.id} className="relative">
                  <div className={`absolute -left-[33px] w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-sm ${index === 0 ? 'bg-primary text-white ring-4 ring-primary/10' : 'bg-secondary text-white'}`}>
                    <Icons.Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{item.status}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(item.date)}</p>
                    {item.comment && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 w-full lg:hidden bg-white border-t border-slate-100 p-4 grid grid-cols-2 gap-4 z-50 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <button onClick={() => updateJobStatus(job.id, 'Finalizado', 'Marcado desde acceso rápido móvil.')} className="h-12 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <Icons.Check className="w-4 h-4" />
          Finalizar
        </button>
        <button onClick={() => updatePaymentStatus(job.id, 'Pagado')} className="h-12 border border-slate-200 text-slate-500 font-bold rounded-xl active:scale-95 flex items-center justify-center gap-2">
          <Icons.Wallet className="w-4 h-4" />
          Pagado
        </button>
      </div>
    </motion.div>
  );
};

export default JobDetail;
