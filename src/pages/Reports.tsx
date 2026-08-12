import React, { useState } from 'react';
import { motion } from 'motion/react';
import { StatsCard, StatusBadge, formatCurrency } from '../components/Common';
import { Icons } from '../components/Icons';
import { Select } from '../components/Select';
import { useDentalFlow } from '../context/DentalFlowContext';
import type { JobStatus, WorkCategory } from '../types';

const statuses: JobStatus[] = ['Recibido', 'En proceso', 'En corrección', 'Finalizado', 'Entregado', 'Cancelado'];
const categories: WorkCategory[] = ['Laboratorio', 'Grill', 'Otro'];

const Reports = () => {
  const { jobs } = useDentalFlow();
  const totalCollected = jobs.reduce((total, job) => total + job.paidValue, 0);
  const pending = jobs.reduce((total, job) => total + Math.max(job.agreedValue - job.paidValue, 0), 0);
  const delivered = jobs.filter((job) => job.status === 'Entregado').length;
  const corrections = jobs.reduce((total, job) => total + job.corrections.length, 0);
  const [categoryFilter, setCategoryFilter] = useState('Todas las categorías');

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-8">
      <section className="bg-white border border-outline-variant rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row gap-4 md:items-end md:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Resumen general</h2>
          <p className="text-sm text-slate-500 mt-1">Vista base para reportes. Después se puede conectar con Supabase y filtros reales.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
          <input type="month" className="h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary" />
          <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full h-11 text-sm">
            <option>Todas las categorías</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </Select>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatsCard title="Trabajos registrados" value={jobs.length} icon={Icons.Trabajos} trend="up" trendValue="Total" />
        <StatsCard title="Total cobrado" value={formatCurrency(totalCollected)} icon={Icons.Wallet} color="secondary" trend="up" trendValue="Pagos" />
        <StatsCard title="Pendiente por cobrar" value={formatCurrency(pending)} icon={Icons.Alert} color="error" trend="down" trendValue="Saldo" />
        <StatsCard title="Entregados" value={delivered} icon={Icons.Truck} color="tertiary" trend="up" trendValue="Cerrados" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg">Trabajos por estado</h3>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            {statuses.map((status) => {
              const count = jobs.filter((job) => job.status === status).length;
              const progress = jobs.length ? Math.round((count / jobs.length) * 100) : 0;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between items-center gap-3">
                    <StatusBadge status={status} />
                    <span className="text-sm font-bold text-slate-600">{count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg">Trabajos por categoría</h3>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            {categories.map((category) => {
              const count = jobs.filter((job) => job.category === category).length;
              const value = jobs.filter((job) => job.category === category).reduce((total, job) => total + job.agreedValue, 0);
              return (
                <div key={category} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400">{category}</p>
                    <p className="font-bold text-slate-700">{count} trabajo(s)</p>
                  </div>
                  <p className="font-bold text-primary">{formatCurrency(value)}</p>
                </div>
              );
            })}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <Icons.Alert className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">Correcciones registradas: <strong>{corrections}</strong>. Más adelante podemos agregar exportación a Excel/PDF.</p>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default Reports;
