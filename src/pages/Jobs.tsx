import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { Tooltip } from '../components/Tooltip';
import { Select } from '../components/Select';
import { DatePicker } from '../components/DatePicker';
import { EmptyState, PaymentBadge, StatusBadge, formatCurrency, formatDate } from '../components/Common';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import { useJobFormModal } from '../context/JobFormModalContext';
import { confirmReject, notifySuccess } from '../lib/notify';
import type { Job, JobStatus, PaymentStatus, WorkCategory } from '../types';

const categories: Array<'Todas' | WorkCategory> = ['Todas', 'Laboratorio', 'Grill', 'Otro'];
const statuses: Array<'Todos' | JobStatus> = ['Todos', 'Recibido', 'En proceso', 'En corrección', 'Finalizado', 'Entregado', 'Cancelado'];
const payments: Array<'Todos' | PaymentStatus> = ['Todos', 'Pendiente', 'Parcial', 'Pagado'];

const Jobs = () => {
  const { currentUser } = useAuth();
  const { jobs, getClientById, updateJobStatus, respondToJobRequest } = useDentalFlow();
  const { openCreateJob } = useJobFormModal();

  const isPendingRequestForMe = (job: Job) => (
    job.requestedLabId === currentUser?.clientId && (!job.labResponse || job.labResponse === 'Pendiente')
  );

  const handleAccept = (jobId: string) => {
    respondToJobRequest(jobId, 'Aceptado');
    notifySuccess('Trabajo aceptado, pasa a producción.');
  };

  const handleReject = async (jobId: string, jobType: string) => {
    const confirmed = await confirmReject('¿Rechazar esta solicitud?', `"${jobType}" quedará marcado como cancelado.`);
    if (!confirmed) return;
    respondToJobRequest(jobId, 'Rechazado');
    notifySuccess('Trabajo rechazado.');
  };
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'Todas' | WorkCategory>('Todas');
  const [status, setStatus] = useState<'Todos' | JobStatus>('Todos');
  const [paymentStatus, setPaymentStatus] = useState<'Todos' | PaymentStatus>('Todos');
  const [deliveryDate, setDeliveryDate] = useState('');

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const client = getClientById(job.clientId);
      const matchesQuery = !normalizedQuery || [
        job.code,
        job.jobType,
        job.category,
        client?.name,
        job.patientReference,
        job.description,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));

      const matchesCategory = category === 'Todas' || job.category === category;
      const matchesStatus = status === 'Todos' || job.status === status;
      const matchesPayment = paymentStatus === 'Todos' || job.paymentStatus === paymentStatus;
      const matchesDate = !deliveryDate || job.estimatedDeliveryDate === deliveryDate;

      return matchesQuery && matchesCategory && matchesStatus && matchesPayment && matchesDate;
    });
  }, [jobs, query, category, status, paymentStatus, deliveryDate, getClientById]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl border border-outline-variant p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
          <div className="relative group flex-1 min-w-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Buscar</label>
            <Icons.Search className="absolute left-4 bottom-3 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Código, cliente, paciente o trabajo..."
              className="w-full h-11 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => openCreateJob()}
            className="h-11 px-5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icons.Plus className="w-5 h-5" />
            Crear trabajo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
            <Select value={category} onChange={(event) => setCategory(event.target.value as 'Todas' | WorkCategory)} className="w-full h-11 text-sm">
              {categories.map((option) => <option key={option}>{option}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado</label>
            <Select value={status} onChange={(event) => setStatus(event.target.value as 'Todos' | JobStatus)} className="w-full h-11 text-sm">
              {statuses.map((option) => <option key={option}>{option}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Pago</label>
            <Select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as 'Todos' | PaymentStatus)} className="w-full h-11 text-sm">
              {payments.map((option) => <option key={option}>{option}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha entrega</label>
            <DatePicker value={deliveryDate} onChange={setDeliveryDate} className="w-full h-11 text-sm" />
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState title="No hay trabajos con esos filtros" description="Cambia la búsqueda o crea un nuevo trabajo." />
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredJobs.map((job) => {
              const client = getClientById(job.clientId);
              return (
                <article key={job.id} className="p-4 space-y-4">
                  <Link to={`/trabajos/${job.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary">{job.code}</p>
                        <h3 className="font-bold text-slate-800 truncate mt-1">{job.jobType}</h3>
                        <p className="text-xs text-slate-400 uppercase font-bold mt-1">{job.category}</p>
                      </div>
                      <Icons.Eye className="w-5 h-5 text-slate-300 shrink-0 mt-2" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Cliente</p>
                        <p className="font-medium text-slate-600 truncate">{client?.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Paciente/ref.</p>
                        <p className="font-medium text-slate-600 truncate">{job.patientReference}</p>
                      </div>
                      {/* <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Entrega</p>
                        <p className="font-medium text-slate-600">{formatDate(job.estimatedDeliveryDate)}</p>
                      </div> */}
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Valor</p>
                        <p className="font-bold text-primary">{formatCurrency(job.agreedValue)}</p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={job.status} />
                      <PaymentBadge status={job.paymentStatus} />
                    </div>
                    <div className="flex items-center gap-2">
                      {isPendingRequestForMe(job) ? (
                        <>
                          <Tooltip content="Rechazar">
                            <button
                              type="button"
                              onClick={() => handleReject(job.id, job.jobType)}
                              aria-label="Rechazar"
                              className="h-9 w-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                            >
                              <Icons.Ban className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Aceptar">
                            <button
                              type="button"
                              onClick={() => handleAccept(job.id)}
                              aria-label="Aceptar"
                              className="h-9 w-9 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 flex items-center justify-center transition-colors"
                            >
                              <Icons.Check className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </>
                      ) : job.status !== 'Entregado' && job.status !== 'Cancelado' && (
                        <button onClick={() => updateJobStatus(job.id, 'Entregado', 'Marcado desde listado móvil.')} className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-2 rounded-xl active:scale-95">
                          Entregar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Tipo / Categoría</th>
                  <th className="px-6 py-4">Cliente / Paciente</th>
                  {/* <th className="px-6 py-4">Entrega</th> */}
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Pago</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const client = getClientById(job.clientId);
                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                      <td className="px-6 py-5 font-bold text-primary text-sm whitespace-nowrap">{job.code}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm whitespace-nowrap">{job.jobType}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase leading-none mt-1">{job.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col min-w-[180px]">
                          <span className="text-sm font-medium text-slate-600">{client?.name}</span>
                          <span className="text-[11px] text-slate-400 italic">Pte/ref: {job.patientReference}</span>
                        </div>
                      </td>
                      {/* <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">{formatDate(job.estimatedDeliveryDate)}</td> */}
                      <td className="px-6 py-5 text-center"><StatusBadge status={job.status} /></td>
                      <td className="px-6 py-5 text-center"><PaymentBadge status={job.paymentStatus} /></td>
                      <td className="px-6 py-5 text-right font-bold text-slate-800 whitespace-nowrap">{formatCurrency(job.agreedValue)}</td>
                      <td className="px-6 py-5 text-left">
                        <div className="flex items-center justify-start gap-2">
                          <Tooltip content="Ver detalle">
                            <Link to={`/trabajos/${job.id}`} aria-label="Ver detalle" className="inline-flex p-2 hover:bg-slate-100 rounded-full text-primary transition-colors">
                              <Icons.Eye className="w-5 h-5" />
                            </Link>
                          </Tooltip>
                          {isPendingRequestForMe(job) && (
                            <>
                              <Tooltip content="Rechazar">
                                <button
                                  type="button"
                                  onClick={() => handleReject(job.id, job.jobType)}
                                  aria-label="Rechazar"
                                  className="h-9 w-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                                >
                                  <Icons.Ban className="w-4 h-4" />
                                </button>
                              </Tooltip>
                              <Tooltip content="Aceptar">
                                <button
                                  type="button"
                                  onClick={() => handleAccept(job.id)}
                                  aria-label="Aceptar"
                                  className="h-9 w-9 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 flex items-center justify-center transition-colors"
                                >
                                  <Icons.Check className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            </>
                          )}                          
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
            <span className="text-xs font-medium text-slate-400">Mostrando {filteredJobs.length} de {jobs.length} trabajos</span>
            <button onClick={() => { setQuery(''); setCategory('Todas'); setStatus('Todos'); setPaymentStatus('Todos'); setDeliveryDate(''); }} className="text-primary font-bold text-xs uppercase tracking-widest hover:underline text-left sm:text-right">
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Jobs;
