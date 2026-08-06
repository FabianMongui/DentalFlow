import React, { useMemo, useState } from 'react';
import { Icons } from '../components/Icons';
import { StatsCard, formatCurrency, initials } from '../components/Common';
import { Modal } from '../components/Modal';
import { Tooltip } from '../components/Tooltip';
import { motion } from 'motion/react';
import { useDentalFlow } from '../context/DentalFlowContext';
import { notifySuccess } from '../lib/notify';
import type { Client, ClientPlan, ClientType } from '../types';

const clientTypes: ClientType[] = ['Cliente individual', 'Laboratorio'];
const clientPlans: ClientPlan[] = ['Básico', 'Pro', 'Premium'];

type ClientFormValues = Omit<Client, 'id'>;

const emptyForm: ClientFormValues = {
  name: '',
  type: 'Cliente individual',
  phone: '',
  email: '',
  address: '',
  city: '',
  active: true,
  plan: 'Básico',
};

const Clients = () => {
  const { clients, jobs, createClientAccount, updateClientAccount } = useDentalFlow();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | ClientType>('Todos');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activa' | 'Inactiva'>('Todos');

  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormValues>(emptyForm);
  const [error, setError] = useState('');

  const cities = useMemo(() => (
    Array.from(new Set(clients.map((client) => client.city).filter((value): value is string => Boolean(value))))
  ), [clients]);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesQuery = !normalizedQuery || [client.name, client.type, client.phone, client.email].some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesType = typeFilter === 'Todos' || client.type === typeFilter;
      const matchesCity = !cityFilter || client.city === cityFilter;
      const matchesStatus = statusFilter === 'Todos' || (statusFilter === 'Activa' ? client.active : !client.active);
      return matchesQuery && matchesType && matchesCity && matchesStatus;
    });
  }, [clients, query, typeFilter, cityFilter, statusFilter]);

  const getClientStats = (clientId: string) => {
    const clientJobs = jobs.filter((job) => job.clientId === clientId);
    const pendingBalance = clientJobs.reduce((total, job) => total + Math.max(job.agreedValue - job.paidValue, 0), 0);
    return { totalJobs: clientJobs.length, pendingBalance };
  };

  const globalPendingBalance = jobs.reduce((total, job) => total + Math.max(job.agreedValue - job.paidValue, 0), 0);
  const topClient = clients
    .map((client) => ({ client, jobsCount: jobs.filter((job) => job.clientId === client.id).length }))
    .sort((a, b) => b.jobsCount - a.jobsCount)[0]?.client;

  const setField = <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setMode('create');
  };

  const openEdit = (client: Client) => {
    setForm({
      name: client.name,
      type: client.type,
      phone: client.phone,
      email: client.email ?? '',
      address: client.address ?? '',
      city: client.city ?? '',
      active: client.active,
      plan: client.plan ?? 'Básico',
    });
    setEditingId(client.id);
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

    if (!form.name.trim() || !form.phone.trim()) {
      setError('Completa al menos nombre y teléfono.');
      return;
    }

    if (mode === 'create') {
      createClientAccount(form);
      notifySuccess('Cliente creado correctamente');
    } else if (mode === 'edit' && editingId) {
      updateClientAccount(editingId, form);
      notifySuccess('Cliente actualizado correctamente');
    }

    closeForm();
  };

  const toggleActive = (client: Client) => {
    updateClientAccount(client.id, { active: !client.active });
    notifySuccess(client.active ? 'Cliente desactivado' : 'Cliente activado');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Clientes</h2>
          <p className="text-sm text-slate-500 mt-1">Odontólogos y laboratorios registrados en DentalFlow.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="h-12 px-6 md:px-8 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Icons.Plus className="w-5 h-5" />
          Crear cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant p-4 shadow-sm space-y-4">
        <div className="relative group">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Buscar</label>
          <Icons.Search className="absolute left-4 bottom-3 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            placeholder="Nombre, tipo, teléfono o correo..."
            className="w-full h-11 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo</label>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'Todos' | ClientType)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none">
              <option value="Todos">Todos</option>
              {clientTypes.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ciudad</label>
            <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none">
              <option value="">Todas</option>
              {cities.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'Todos' | 'Activa' | 'Inactiva')} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none">
              <option value="Todos">Todos</option>
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </div>
        </div>
      </div>

      <Modal open={mode !== null} onClose={closeForm} title={mode === 'create' ? 'Nuevo cliente' : 'Editar cliente'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex gap-2">
              <Icons.Alert className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
              <input value={form.name} onChange={(event) => setField('name', event.target.value)} type="text" placeholder="Nombre del odontólogo o laboratorio" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo</label>
              <select value={form.type} onChange={(event) => setField('type', event.target.value as ClientType)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                {clientTypes.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono</label>
              <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} type="text" placeholder="+57 300 000 0000" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Correo</label>
              <input value={form.email} onChange={(event) => setField('email', event.target.value)} type="email" placeholder="correo@ejemplo.com" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ciudad</label>
              <input value={form.city} onChange={(event) => setField('city', event.target.value)} type="text" placeholder="Ej. Bogotá" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección</label>
              <input value={form.address} onChange={(event) => setField('address', event.target.value)} type="text" placeholder="Dirección completa" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Plan</label>
              <select value={form.plan} onChange={(event) => setField('plan', event.target.value as ClientPlan)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                {clientPlans.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.active} onChange={(event) => setField('active', event.target.checked)} className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary cursor-pointer" />
            <span className="text-sm font-medium text-slate-600">Cuenta activa (puede iniciar sesión)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
            <button type="button" onClick={closeForm} className="h-9 px-4 rounded-lg border border-outline-variant text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="h-9 px-4 bg-primary text-white text-sm font-bold rounded-lg active:scale-95 transition-all">
              {mode === 'create' ? 'Crear cliente' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {filteredClients.length === 0 ? (
        <div className="bg-white border border-dashed border-outline-variant rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <Icons.Clientes className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700">No hay clientes con esos filtros</h3>
          <p className="text-sm text-slate-400 mt-1">Cambia la búsqueda o crea un nuevo cliente.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredClients.map((client) => {
              const stats = getClientStats(client.id);
              return (
                <article key={client.id} className="p-4 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs bg-slate-50 text-slate-500 border border-slate-100 shrink-0">
                      {initials(client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-700 truncate">{client.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{client.type}{client.city ? ` · ${client.city}` : ''}</p>
                      <p className="text-sm text-slate-500 mt-2">{client.phone}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${client.active ? 'bg-secondary/10 text-secondary' : 'bg-red-50 text-red-500'}`}>
                      {client.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Trabajos</p>
                      <p className="font-bold text-slate-700">{stats.totalJobs}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Saldo pendiente</p>
                      <p className={`font-bold ${stats.pendingBalance === 0 ? 'text-secondary' : 'text-red-500'}`}>{formatCurrency(stats.pendingBalance)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <button type="button" onClick={() => openEdit(client)} className="h-9 px-3 rounded-xl border border-outline-variant text-xs font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">Editar</button>
                    <Tooltip content={client.active ? 'Desactivar' : 'Activar'}>
                      <button
                        type="button"
                        onClick={() => toggleActive(client)}
                        aria-label={client.active ? 'Desactivar' : 'Activar'}
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${client.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'}`}
                      >
                        {client.active ? <Icons.Ban className="w-4 h-4" /> : <Icons.Check className="w-4 h-4" />}
                      </button>
                    </Tooltip>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Ciudad</th>
                  <th className="px-6 py-4 text-center">Trabajos</th>
                  <th className="px-6 py-4 text-right">Saldo pendiente</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const stats = getClientStats(client.id);
                  return (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-slate-50 text-slate-500 border border-slate-100 shrink-0">
                            {initials(client.name)}
                          </div>
                          <div className="flex flex-col min-w-[160px]">
                            <span className="font-bold text-slate-700 text-sm">{client.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{client.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${client.type === 'Laboratorio' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {client.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">{client.city || '—'}</td>
                      <td className="px-6 py-5 text-center text-sm font-bold text-slate-600">{stats.totalJobs}</td>
                      <td className={`px-6 py-5 text-right font-bold text-sm whitespace-nowrap ${stats.pendingBalance === 0 ? 'text-secondary' : 'text-red-500'}`}>
                        {formatCurrency(stats.pendingBalance)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${client.active ? 'bg-secondary/10 text-secondary' : 'bg-red-50 text-red-500'}`}>
                          {client.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => openEdit(client)} className="h-9 px-3 rounded-xl border border-outline-variant text-xs font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">Editar</button>
                          <Tooltip content={client.active ? 'Desactivar' : 'Activar'}>
                            <button
                              type="button"
                              onClick={() => toggleActive(client)}
                              aria-label={client.active ? 'Desactivar' : 'Activar'}
                              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${client.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'}`}
                            >
                              {client.active ? <Icons.Ban className="w-4 h-4" /> : <Icons.Check className="w-4 h-4" />}
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Saldo pendiente global" value={formatCurrency(globalPendingBalance)} icon={Icons.Wallet} color="error" trend="down" trendValue="Por cobrar" />
        <StatsCard title="Clientes registrados" value={clients.length} icon={Icons.TrendingUp} color="secondary" trend="up" trendValue="Total" />
        <StatsCard title="Cliente destacado" value={topClient?.name || 'Sin datos'} icon={Icons.Star} color="primary" />
      </div>
    </motion.div>
  );
};

export default Clients;
