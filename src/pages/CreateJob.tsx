import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { JobForm } from '../components/JobForm';
import { motion } from 'motion/react';
import type { JobInput } from '../types';

const CreateJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLabId = searchParams.get('labId') ?? undefined;
  const [liveForm, setLiveForm] = useState<Pick<JobInput, 'status'> | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl border border-outline-variant shadow-sm">
          <JobForm
            initialLabId={preselectedLabId}
            onSuccess={(job) => navigate(`/trabajos/${job.id}`)}
            onCancel={() => navigate('/trabajos')}
            onFormChange={(form) => setLiveForm({ status: form.status })}
          />
        </div>
      </div>

      <aside className="space-y-6 lg:space-y-8">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-6">
          <h3 className="font-bold text-lg">Flujo simple</h3>
          <div className="relative pl-6 space-y-6 border-l-2 border-slate-100 py-2">
            {[
              { label: 'Recibido', desc: 'Ingreso del trabajo', active: true, icon: Icons.Check },
              { label: 'En proceso', desc: 'Producción', active: liveForm?.status !== 'Recibido' && !!liveForm, icon: Icons.Dashboard },
              { label: 'Entregado', desc: 'Cierre', active: liveForm?.status === 'Entregado', icon: Icons.Truck },
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
              <span className="text-xs text-slate-400">Estado</span>
              <span className="text-xs font-bold text-right">{liveForm?.status ?? 'Recibido'}</span>
            </div>
          </div>
        </div>
      </aside>
    </motion.div>
  );
};

export default CreateJob;
