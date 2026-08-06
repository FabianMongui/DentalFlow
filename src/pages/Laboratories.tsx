import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Icons } from '../components/Icons';
import { Modal } from '../components/Modal';
import { EmptyState, formatCurrency, initials } from '../components/Common';
import { useDentalFlow, type LabDirectoryEntry } from '../context/DentalFlowContext';
import type { WorkCategory } from '../types';

const categories: Array<'Todas' | WorkCategory> = ['Todas', 'Laboratorio', 'Grill', 'Otro'];

const priceRange = (lab: LabDirectoryEntry) => {
  if (lab.services.length === 0) return null;
  const prices = lab.services.map((service) => service.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

const Laboratories = () => {
  const navigate = useNavigate();
  const { labDirectory } = useDentalFlow();
  const [query, setQuery] = useState('');
  const [labId, setLabId] = useState('');
  const [category, setCategory] = useState<'Todas' | WorkCategory>('Todas');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedLab, setSelectedLab] = useState<LabDirectoryEntry | null>(null);

  const cities = useMemo(() => (
    Array.from(new Set(labDirectory.map((lab) => lab.city).filter((value): value is string => Boolean(value))))
  ), [labDirectory]);

  const filteredLabs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;

    return labDirectory.filter((lab) => {
      const matchesQuery = !normalizedQuery || lab.name.toLowerCase().includes(normalizedQuery);
      const matchesLab = !labId || lab.id === labId;
      const matchesCategory = category === 'Todas' || lab.services.some((service) => service.category === category);
      const matchesCity = !city || lab.city === city;
      const matchesPrice = (!min && !max) || lab.services.some((service) => (
        (min === undefined || service.price >= min) && (max === undefined || service.price <= max)
      ));

      return matchesQuery && matchesLab && matchesCategory && matchesCity && matchesPrice;
    });
  }, [labDirectory, query, labId, category, city, minPrice, maxPrice]);

  const clearFilters = () => {
    setQuery('');
    setLabId('');
    setCategory('Todas');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
  };

  const handleRequestJob = (lab: LabDirectoryEntry) => {
    navigate(`/trabajos/nuevo?labId=${lab.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl border border-outline-variant p-4 shadow-sm space-y-4">
        <div className="relative group">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Buscar</label>
          <Icons.Search className="absolute left-4 bottom-3 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre del laboratorio..."
            className="w-full h-11 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Laboratorio</label>
            <select value={labId} onChange={(event) => setLabId(event.target.value)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none">
              <option value="">Todos</option>
              {labDirectory.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de servicio</label>
            <select value={category} onChange={(event) => setCategory(event.target.value as 'Todas' | WorkCategory)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none">
              {categories.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ciudad</label>
            <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none">
              <option value="">Todas</option>
              {cities.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rango de precio (COP)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Mín"
                className="w-1/2 h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              />
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Máx"
                className="w-1/2 h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {filteredLabs.length === 0 ? (
        <EmptyState title="No hay laboratorios con esos filtros" description="Cambia la búsqueda o limpia los filtros para ver más resultados." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredLabs.map((lab) => {
              const range = priceRange(lab);
              return (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => setSelectedLab(lab)}
                  className="text-left bg-white rounded-2xl border border-outline-variant p-5 shadow-sm hover:border-primary transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs bg-slate-50 text-slate-500 border border-slate-100 shrink-0">
                      {initials(lab.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{lab.name}</h3>
                      {lab.city && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Icons.City className="w-3.5 h-3.5" />
                          {lab.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500">{lab.services.length} servicio(s)</span>
                    {range && (
                      <span className="text-xs font-bold text-primary">
                        {range.min === range.max ? formatCurrency(range.min) : `${formatCurrency(range.min)} - ${formatCurrency(range.max)}`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button onClick={clearFilters} className="text-primary font-bold text-xs uppercase tracking-widest hover:underline">
              Limpiar filtros
            </button>
          </div>
        </>
      )}

      <Modal open={!!selectedLab} onClose={() => setSelectedLab(null)} title={selectedLab?.name}>
        {selectedLab && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servicios disponibles</h4>
              {selectedLab.services.length === 0 ? (
                <p className="text-sm text-slate-400">Este laboratorio aún no tiene servicios publicados.</p>
              ) : (
                <div className="space-y-3">
                  {selectedLab.services.map((service) => (
                    <div key={service.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{service.name}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 mt-1">
                            <Icons.Tag className="w-3 h-3" />
                            {service.category} · {service.turnaroundDays} día(s)
                          </span>
                        </div>
                        <span className="font-bold text-primary text-sm whitespace-nowrap">{formatCurrency(service.price)}</span>
                      </div>
                      {service.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Datos de contacto</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {selectedLab.city && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Icons.City className="w-4 h-4 text-primary shrink-0" />
                    {selectedLab.city}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Icons.Mail className="w-4 h-4 text-primary shrink-0" />
                  {selectedLab.email || 'Sin correo registrado'}
                </div>
                <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                  <Icons.Share className="w-4 h-4 text-primary shrink-0" />
                  {selectedLab.phone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRequestJob(selectedLab)}
              className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Icons.Plus className="w-5 h-5" />
              Solicitar trabajo
            </button>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Laboratories;
