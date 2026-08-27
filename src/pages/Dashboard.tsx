import React from 'react';
import { Link } from 'react-router-dom';
import { StatsCard, StatusBadge, formatCurrency, formatDate } from '../components/Common';
import { ActivityChart } from '../components/ActivityChart';
import { Icons } from '../components/Icons';
import { motion } from 'motion/react';
import { useDentalFlow } from '../context/DentalFlowContext';
import { useAuth } from '../context/AuthContext';
import { useJobFormModal } from '../context/JobFormModalContext';

const Dashboard = () => {
  const { jobs, getClientById } = useDentalFlow();
  const { currentUser } = useAuth();
  const { openCreateJob } = useJobFormModal();
  const displayName = currentUser?.role === 'super_admin' ? currentUser.name.split(' ')[0] : currentUser?.name ?? '';
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthJobs = jobs.filter((job) => {
    const date = new Date(`${job.entryDate}T00:00:00`);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const inProcess = jobs.filter((job) => ['Recibido', 'En proceso', 'En corrección'].includes(job.status));
  const delivered = monthJobs.filter((job) => job.status === 'Entregado');
  const pendingPayments = jobs.filter((job) => job.paymentStatus !== 'Pagado');
  const pendingCorrections = jobs.filter((job) => job.corrections.some((correction) => correction.status === 'Pendiente'));
  const collected = monthJobs.reduce((total, job) => total + job.paidValue, 0);
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const categoryTotals = ['Laboratorio', 'Grill', 'Otro'].map((category) => {
    const count = jobs.filter((job) => job.category === category).length;
    const progress = jobs.length ? Math.round((count / jobs.length) * 100) : 0;
    return { label: category, progress };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-8"
    >
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-container to-secondary p-5 sm:p-7 text-white shadow-xl shadow-primary/20">
        <div className="absolute -top-16 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Buen día, {displayName}</h2>
            <p className="text-sm sm:text-base text-white/80 mt-1">Resumen rápido de trabajos, entregas y pagos.</p>
          </div>
          <button
            type="button"
            onClick={() => openCreateJob()}
            className="h-12 px-5 bg-white text-primary font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white/90 w-fit"
          >
            <Icons.Plus className="w-5 h-5" />
            Crear trabajo
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-outline-variant card-hover flex flex-col justify-between min-h-[112px] relative overflow-hidden">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">Total cobrado</span>
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              <Icons.Wallet className="w-4 h-4 text-white" />
            </span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold break-words truncate text-slate-800">{formatCurrency(collected)}</h3>
            <span className="text-xs font-medium text-secondary">Mes actual</span>
          </div>
        </div>

        <StatsCard title="Trabajos Mes" value={monthJobs.length} trend="up" trendValue="Ingresados" icon={Icons.Trabajos} />
        <StatsCard title="En Proceso" value={inProcess.length} trend="up" trendValue="Activos" icon={Icons.Clock} color="tertiary" />
        <StatsCard title="Pagos Pendientes" value={pendingPayments.length} trend="down" trendValue="Por cobrar" icon={Icons.Alert} color="error" />
        <StatsCard title="Entregados Mes" value={delivered.length} trend="up" trendValue="Finalizados" icon={Icons.Truck} color="secondary" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant p-5 sm:p-6 shadow-sm">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">Actividad de los últimos 6 meses</h3>
              <p className="text-xs text-slate-400 mt-1">Trabajos ingresados vs. entregados por mes</p>
            </div>
            <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icons.Reportes className="w-4.5 h-4.5 text-primary" />
            </span>
          </div>
          <ActivityChart jobs={jobs} />
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant p-5 sm:p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Resumen por categoría</h3>
            <p className="text-xs text-slate-400 mt-1">Distribución de trabajos activos y registrados.</p>
          </div>
          <div className="space-y-5">
            {categoryTotals.map((step) => (
              <div key={step.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-tight">
                  <span>{step.label}</span>
                  <span>{step.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${step.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-primary/5 rounded-xl flex items-start gap-3 border border-primary/10">
            <Icons.Alert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Hay {pendingCorrections.length} trabajo(s) con correcciones pendientes. Puedes gestionarlos desde el detalle.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-outline-variant flex justify-between items-center gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Trabajos recientes</h3>
            <p className="text-xs text-slate-400 mt-1">Últimos movimientos del sistema</p>
          </div>
          <Link to="/trabajos" className="text-primary font-bold text-sm hover:underline whitespace-nowrap">Ver todos</Link>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {recentJobs.map((job) => {
            const client = getClientById(job.clientId);
            return (
              <Link key={job.id} to={`/trabajos/${job.id}`} className="block p-4 active:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{job.jobType}</p>
                    <p className="text-xs text-slate-400 mt-1 truncate">{job.code} · {client?.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Entrega: {formatDate(job.estimatedDeliveryDate)}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <StatusBadge status={job.status} />
                    <p className="text-sm font-bold text-primary">{formatCurrency(job.agreedValue)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Trabajo</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentJobs.map((job) => {
                const client = getClientById(job.clientId);
                return (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <Link to={`/trabajos/${job.id}`} className="flex flex-col">
                        <span className="font-bold text-slate-700">{job.jobType}</span>
                        <span className="text-xs text-slate-400">{job.code} · {job.patientReference}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{client?.name}</td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={job.status} /></td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(job.agreedValue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
