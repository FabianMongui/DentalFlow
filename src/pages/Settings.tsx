import React from 'react';
import { motion } from 'motion/react';
import { Icons } from '../components/Icons';

const Settings = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 bg-white border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.Configuracion className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Configuración inicial</h2>
            <p className="text-sm text-slate-500">Esta pantalla queda lista para parámetros del negocio.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['Nombre del negocio', 'DentalFlow Lab'],
            ['Moneda', 'COP'],
            ['Zona horaria', 'America/Bogota'],
            ['Numeración', 'DF-0000'],
          ].map(([label, value]) => (
            <label key={label} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{label}</span>
              <input defaultValue={value} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
            </label>
          ))}
        </div>

        <button className="h-12 px-6 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">Guardar configuración</button>
      </section>

      <aside className="bg-white border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 h-fit">
        <h3 className="font-bold text-lg">Siguiente fase</h3>
        <p className="text-sm text-slate-500 leading-relaxed">Cuando conectemos Supabase, aquí podemos administrar usuarios, estados personalizados, tipos de trabajo y datos del negocio.</p>
      </aside>
    </motion.div>
  );
};

export default Settings;
