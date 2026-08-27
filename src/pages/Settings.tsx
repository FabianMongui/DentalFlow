import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Icons } from '../components/Icons';
import { StatusBadge } from '../components/Common';
import { useTheme } from '../context/ThemeContext';
import { getThemePreset, themeSwatch, themeVariables } from '../lib/themes';
import type { ThemePreset } from '../lib/themes';
import { notifySuccess } from '../lib/notify';
import type { ThemeId } from '../types';

interface ThemeCardProps {
  preset: ThemePreset;
  active: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onPreviewEnd: () => void;
}

const ThemeCard = ({ preset, active, onSelect, onPreview, onPreviewEnd }: ThemeCardProps) => {
  const swatch = themeSwatch(preset);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      onMouseLeave={onPreviewEnd}
      onBlur={onPreviewEnd}
      aria-pressed={active}
      className={`relative text-left rounded-2xl border p-3 transition-all active:scale-[0.98] ${active
        ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
        : 'border-outline-variant hover:border-primary/40 hover:shadow-md'}`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-8 h-8 rounded-xl shrink-0" style={{ background: swatch.primary }} />
        <span className="w-4 h-8 rounded-lg shrink-0" style={{ background: swatch.primaryContainer }} />
        <span className="w-4 h-8 rounded-lg shrink-0" style={{ background: swatch.accent }} />
        {active && (
          <span className="ml-auto text-primary shrink-0">
            <Icons.Check className="w-4 h-4" />
          </span>
        )}
      </div>
      <span className="block text-sm font-bold text-slate-800 leading-tight">{preset.label}</span>
      <span className="block text-[11px] text-slate-400 leading-tight mt-0.5">{preset.description}</span>
    </button>
  );
};

const Settings = () => {
  const { themeId, preset, presets, setTheme, canPersistToAccount } = useTheme();
  // El panel de la derecha muestra el tema que el usuario está apuntando; al
  // salir del botón vuelve al tema activo.
  const [previewId, setPreviewId] = useState<ThemeId | null>(null);
  const previewPreset = previewId ? getThemePreset(previewId) : preset;

  const handleSelect = (id: ThemeId) => {
    if (id === themeId) return;
    setTheme(id);
    notifySuccess('Tema actualizado');
  };

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
        <h3 className="font-bold text-lg">Vista previa</h3>
        <div style={themeVariables(previewPreset) as React.CSSProperties} className="rounded-2xl border border-outline-variant bg-surface p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-sm">DF</span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">{previewPreset.label}</p>
              <p className="text-[11px] text-slate-400">{previewPreset.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="En proceso" />
            <StatusBadge status="Entregado" />
          </div>
          <button type="button" className="h-10 w-full bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md shadow-primary/25">
            Crear trabajo
          </button>
          <button type="button" className="h-10 w-full bg-secondary/10 text-secondary rounded-xl font-bold text-sm">
            Acción secundaria
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Todos los tonos se derivan del color elegido manteniendo la misma luminosidad, así el contraste de textos y botones no cambia entre temas.
        </p>
      </aside>

      <section className="lg:col-span-3 bg-white border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Icons.Configuracion className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Color de la interfaz</h2>
            <p className="text-sm text-slate-500">
              {canPersistToAccount
                ? 'El color queda guardado en la cuenta y se aplica en toda la aplicación.'
                : 'Como súper administrador el color se guarda solo en este dispositivo.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {presets.map((item) => (
            <ThemeCard
              key={item.id}
              preset={item}
              active={item.id === themeId}
              onSelect={() => handleSelect(item.id)}
              onPreview={() => setPreviewId(item.id)}
              onPreviewEnd={() => setPreviewId(null)}
            />
          ))}
        </div>
      </section>

      <aside className="lg:col-span-3 bg-white border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 h-fit">
        <h3 className="font-bold text-lg">Siguiente fase</h3>
        <p className="text-sm text-slate-500 leading-relaxed">Cuando conectemos Supabase, aquí podemos administrar usuarios, estados personalizados, tipos de trabajo y datos del negocio.</p>
      </aside>
    </motion.div>
  );
};

export default Settings;
