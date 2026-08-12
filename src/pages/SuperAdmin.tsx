import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Icons } from '../components/Icons';
import { Tooltip } from '../components/Tooltip';
import { Select } from '../components/Select';
import { initials } from '../components/Common';
import { useDentalFlow } from '../context/DentalFlowContext';
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

const SuperAdmin = () => {
  const { clients, jobs, createClientAccount, updateClientAccount } = useDentalFlow();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormValues>(emptyForm);
  const [error, setError] = useState('');

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return clients;
    return clients.filter((client) => [client.name, client.type, client.phone, client.email].some((value) => value?.toLowerCase().includes(normalizedQuery)));
  }, [clients, query]);

  const jobsCountByClient = (clientId: string) => jobs.filter((job) => job.clientId === clientId).length;

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
    } else if (mode === 'edit' && editingId) {
      updateClientAccount(editingId, form);
    }

    closeForm();
  };

  const toggleActive = (client: Client) => {
    updateClientAccount(client.id, { active: !client.active });
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
            <Icons.SuperAdmin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Administración de cuentas</h2>
            <p className="text-sm text-slate-500 mt-1">Crea, edita y activa/desactiva cuentas de odontólogos y laboratorios.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="h-12 px-6 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Icons.Plus className="w-5 h-5" />
          Crear cuenta
        </button>
      </section>

      {mode && (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-2xl border border-outline-variant shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{mode === 'create' ? 'Nueva cuenta' : 'Editar cuenta'}</h3>
            <button type="button" onClick={closeForm} className="text-sm font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex gap-2">
              <Icons.Alert className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
              <input value={form.name} onChange={(event) => setField('name', event.target.value)} type="text" placeholder="Nombre del odontólogo o laboratorio" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo</label>
              <Select value={form.type} onChange={(event) => setField('type', event.target.value as ClientType)} className="w-full h-12">
                {clientTypes.map((option) => <option key={option}>{option}</option>)}
              </Select>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección</label>
              <input value={form.address} onChange={(event) => setField('address', event.target.value)} type="text" placeholder="Ciudad, dirección" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ciudad</label>
              <input value={form.city} onChange={(event) => setField('city', event.target.value)} type="text" placeholder="Ej. Bogotá" className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Plan</label>
              <Select value={form.plan} onChange={(event) => setField('plan', event.target.value as ClientPlan)} className="w-full h-12">
                {clientPlans.map((option) => <option key={option}>{option}</option>)}
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.active} onChange={(event) => setField('active', event.target.checked)} className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary cursor-pointer" />
            <span className="text-sm font-medium text-slate-600">Cuenta activa (puede iniciar sesión)</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit" className="flex-1 h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
              {mode === 'create' ? 'Crear cuenta' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      <div className="relative group max-w-xl">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="text"
          placeholder="Buscar por nombre, tipo, teléfono o correo..."
          className="w-full h-12 pl-12 pr-4 bg-white border border-outline-variant rounded-2xl outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredClients.map((client) => (
            <article key={client.id} className="p-4 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs bg-slate-50 text-slate-500 border border-slate-100 shrink-0">
                  {initials(client.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-700 truncate">{client.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{client.type} · {client.plan}</p>
                  <p className="text-sm text-slate-500 mt-1">{client.phone}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${client.active ? 'bg-secondary/10 text-secondary' : 'bg-red-50 text-red-500'}`}>
                  {client.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 text-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Trabajos</p>
                  <p className="font-bold text-slate-700">{jobsCountByClient(client.id)}</p>
                </div>
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
              </div>
            </article>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4 text-center">Trabajos</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-slate-50 text-slate-500 border border-slate-100 shrink-0">
                        {initials(client.name)}
                      </div>
                      <div className="flex flex-col min-w-[180px]">
                        <span className="font-bold text-slate-700 text-sm">{client.name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{client.email || client.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${client.type === 'Laboratorio' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {client.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">{client.plan}</td>
                  <td className="px-6 py-5 text-center text-sm font-bold text-slate-600">{jobsCountByClient(client.id)}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdmin;
