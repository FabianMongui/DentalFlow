import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Icons } from '../components/Icons';
import { Modal } from '../components/Modal';
import { Tooltip } from '../components/Tooltip';
import { formatCurrency } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import { notifySuccess, confirmDelete } from '../lib/notify';
import type { ServiceInput, WorkCategory } from '../types';

const categories: WorkCategory[] = ['Laboratorio', 'Grill', 'Otro'];

const emptyForm: ServiceInput = {
  name: '',
  category: 'Laboratorio',
  price: 0,
  turnaroundDays: 7,
  active: true,
  description: '',
};

const Services = () => {
  const { currentUser } = useAuth();
  const { services, clients, getClientById, createService, updateService, deleteService } = useDentalFlow();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canManage = currentUser?.role === 'client_admin' || isSuperAdmin;
  const labs = useMemo(() => clients.filter((client) => client.type === 'Laboratorio'), [clients]);

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceInput>(emptyForm);
  const [targetClientId, setTargetClientId] = useState('');
  const [error, setError] = useState('');

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return services;
    return services.filter((service) => [service.name, service.category].some((value) => value.toLowerCase().includes(normalizedQuery)));
  }, [services, query]);

  const setField = <K extends keyof ServiceInput>(key: K, value: ServiceInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setTargetClientId(labs[0]?.id ?? '');
    setEditingId(null);
    setError('');
    setMode('create');
  };

  const openEdit = (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    setForm({
      name: service.name,
      category: service.category,
      price: service.price,
      turnaroundDays: service.turnaroundDays,
      active: service.active,
      description: service.description ?? '',
    });
    setTargetClientId(service.clientId);
    setEditingId(serviceId);
    setError('');
    setMode('edit');
  };

  const closeForm = () => {
    setMode(null);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || form.price <= 0) {
      setError('Completa al menos nombre y un precio mayor a cero.');
      return;
    }

    if (isSuperAdmin && mode === 'create' && !targetClientId) {
      setError('Selecciona a qué laboratorio pertenece este servicio.');
      return;
    }

    if (mode === 'create') {
      createService(form, targetClientId);
      notifySuccess('Servicio creado correctamente');
    } else if (mode === 'edit' && editingId) {
      updateService(editingId, form);
      notifySuccess('Servicio actualizado correctamente');
    }

    closeForm();
  };

  const toggleActive = (serviceId: string, active: boolean) => {
    updateService(serviceId, { active: !active });
    notifySuccess(active ? 'Servicio desactivado' : 'Servicio activado');
  };

  const handleDelete = async (serviceId: string, name: string) => {
    const confirmed = await confirmDelete('¿Eliminar este servicio?', `"${name}" se eliminará permanentemente.`);
    if (!confirmed) return;
    deleteService(serviceId);
    notifySuccess('Servicio eliminado');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-8"
    >
      <section className="bg-white border border-outline-variant rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row gap-4 md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icons.Servicios className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Servicios</h2>
            <p className="text-sm text-slate-500 mt-1">
              {isSuperAdmin ? 'Catálogo de servicios de todos los laboratorios.' : 'Publica y mantén actualizado el catálogo que ven los odontólogos.'}
            </p>
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="h-12 px-6 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Icons.Plus className="w-5 h-5" />
            Crear servicio
          </button>
        )}
      </section>

      <Modal open={mode !== null} onClose={closeForm} title={mode === 'create' ? 'Nuevo servicio' : 'Editar servicio'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex gap-2">
              <Icons.Alert className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isSuperAdmin && mode === 'create' && (
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Laboratorio</label>
                <select value={targetClientId} onChange={(event) => setTargetClientId(event.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                  {labs.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
                </select>
              </div>
            )}
            {isSuperAdmin && mode === 'edit' && (
              <div className="space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Laboratorio</span>
                <p className="text-sm font-bold text-slate-600 px-1">{getClientById(targetClientId)?.name}</p>
              </div>
            )}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre del servicio</label>
              <input value={form.name} onChange={(event) => setField('name', event.target.value)} type="text" placeholder="Ej. Corona de Zirconio" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
              <select value={form.category} onChange={(event) => setField('category', event.target.value as WorkCategory)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                {categories.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Días de entrega</label>
              <input value={form.turnaroundDays || ''} onChange={(event) => setField('turnaroundDays', Number(event.target.value))} type="number" min="0" placeholder="7" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Precio (COP)</label>
              <input value={form.price || ''} onChange={(event) => setField('price', Number(event.target.value))} type="number" min="0" placeholder="0" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
              <textarea value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Detalles del servicio, materiales, alcance..." rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none" />
            </div>
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.active} onChange={(event) => setField('active', event.target.checked)} className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary cursor-pointer" />
            <span className="text-sm font-medium text-slate-600">Servicio activo (visible para odontólogos)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
            <button type="button" onClick={closeForm} className="h-9 px-4 rounded-lg border border-outline-variant text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="h-9 px-4 bg-primary text-white text-sm font-bold rounded-lg active:scale-95 transition-all">
              {mode === 'create' ? 'Crear servicio' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="relative group max-w-xl">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="text"
          placeholder="Buscar por nombre o categoría..."
          className="w-full h-12 pl-12 pr-4 bg-white border border-outline-variant rounded-2xl outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
        />
      </div>

      {filteredServices.length === 0 ? (
        <div className="bg-white border border-dashed border-outline-variant rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <Icons.Servicios className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700">Aún no hay servicios</h3>
          <p className="text-sm text-slate-400 mt-1">Crea tu primer servicio para que los odontólogos puedan encontrarlo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredServices.map((service) => (
              <article key={service.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-700 truncate">{service.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{service.category} · {service.turnaroundDays} día(s)</p>
                    {isSuperAdmin && <p className="text-xs text-primary font-bold mt-1">{getClientById(service.clientId)?.name}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${service.active ? 'bg-secondary/10 text-secondary' : 'bg-red-50 text-red-500'}`}>
                    {service.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="font-bold text-primary">{formatCurrency(service.price)}</p>
                {canManage && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <button type="button" onClick={() => openEdit(service.id)} className="h-9 px-3 rounded-xl border border-outline-variant text-xs font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">Editar</button>
                    <Tooltip content={service.active ? 'Desactivar' : 'Activar'}>
                      <button
                        type="button"
                        onClick={() => toggleActive(service.id, service.active)}
                        aria-label={service.active ? 'Desactivar' : 'Activar'}
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${service.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'}`}
                      >
                        {service.active ? <Icons.Ban className="w-4 h-4" /> : <Icons.Check className="w-4 h-4" />}
                      </button>
                    </Tooltip>
                    <Tooltip content="Eliminar">
                      <button
                        type="button"
                        onClick={() => handleDelete(service.id, service.name)}
                        aria-label="Eliminar"
                        className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center ml-auto"
                      >
                        <Icons.Delete className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Servicio</th>
                  <th className="px-6 py-4">Categoría</th>
                  {isSuperAdmin && <th className="px-6 py-4">Laboratorio</th>}
                  <th className="px-6 py-4 text-center">Entrega</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  {canManage && <th className="px-6 py-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-700 text-sm">{service.name}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Icons.Tag className="w-3.5 h-3.5" />
                        {service.category}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">{getClientById(service.clientId)?.name}</td>
                    )}
                    <td className="px-6 py-5 text-center text-sm text-slate-500">{service.turnaroundDays} día(s)</td>
                    <td className="px-6 py-5 text-right font-bold text-slate-800">{formatCurrency(service.price)}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${service.active ? 'bg-secondary/10 text-secondary' : 'bg-red-50 text-red-500'}`}>
                        {service.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => openEdit(service.id)} className="h-9 px-3 rounded-xl border border-outline-variant text-xs font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">Editar</button>
                          <Tooltip content={service.active ? 'Desactivar' : 'Activar'}>
                            <button
                              type="button"
                              onClick={() => toggleActive(service.id, service.active)}
                              aria-label={service.active ? 'Desactivar' : 'Activar'}
                              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${service.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'}`}
                            >
                              {service.active ? <Icons.Ban className="w-4 h-4" /> : <Icons.Check className="w-4 h-4" />}
                            </button>
                          </Tooltip>
                          <Tooltip content="Eliminar">
                            <button
                              type="button"
                              onClick={() => handleDelete(service.id, service.name)}
                              aria-label="Eliminar"
                              className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                            >
                              <Icons.Delete className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Services;
