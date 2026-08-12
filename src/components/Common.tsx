import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import { useJobFormModal } from '../context/JobFormModalContext';
import type { JobStatus, PaymentStatus } from '../types';

export const initials = (name: string) => name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase();

type StatsCardColor = 'primary' | 'secondary' | 'tertiary' | 'error';
type StatsCardTrend = 'up' | 'down';

export interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: StatsCardTrend;
  trendValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: StatsCardColor;
}

export const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(value || 0);

export const formatDate = (value?: string) => {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const statsCardColors: Record<StatsCardColor, string> = {
  primary: 'text-primary border-primary/20',
  secondary: 'text-secondary border-secondary/20',
  tertiary: 'text-tertiary border-tertiary/20',
  error: 'text-red-600 border-red-100',
};

export const StatsCard = ({ title, value, trend, trendValue, icon: Icon, color = 'primary' }: StatsCardProps) => {
  const isPositive = trend === 'up';

  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-1.5 group hover:border-primary transition-colors min-h-[110px]">
      <div className="flex justify-between items-start gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors leading-tight">{title}</span>
        {Icon && <Icon className={`w-4 h-4 shrink-0 ${statsCardColors[color]}`} />}
      </div>
      <span className={`text-xl sm:text-2xl font-bold break-words truncate ${statsCardColors[color]}`}>{value}</span>
      {trendValue && (
        <span className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-secondary' : 'text-red-500'}`}>
          {isPositive ? <Icons.TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <Icons.TrendingDown className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate">{trendValue}</span>
        </span>
      )}
    </div>
  );
};

export const Header = ({ title, showCreate = true }: { title: string, showCreate?: boolean }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { getClientById } = useDentalFlow();
  const { openCreateJob } = useJobFormModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = currentUser?.name ?? 'Invitado';
  const roleLabel = currentUser?.role === 'super_admin'
    ? 'Súper administrador'
    : getClientById(currentUser?.clientId)?.type ?? 'Cuenta';

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="flex justify-between items-center min-h-16 px-4 md:px-8 w-full z-40 sticky top-0 bg-white/90 backdrop-blur-md border-b border-outline-variant">
      <div className="min-w-0 pr-3">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {showCreate && (
          <button
            type="button"
            onClick={() => openCreateJob()}
            className="bg-primary text-white px-3 sm:px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary/20"
          >
            <Icons.Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Crear trabajo</span>
          </button>
        )}
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-xs font-bold text-slate-700">{displayName}</span>
          <span className="text-[10px] text-slate-400">{roleLabel}</span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Cuenta de usuario"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm hover:bg-primary/20 transition-colors"
          >
            {initials(displayName)}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-52 bg-white border border-outline-variant rounded-2xl shadow-xl overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-bold text-slate-700">{displayName}</p>
                <p className="text-xs text-slate-400">{roleLabel}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <Icons.Logout className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const statusClasses: Record<JobStatus, string> = {
  Recibido: 'bg-slate-100 text-slate-600 border-slate-200',
  'En proceso': 'bg-blue-50 text-blue-700 border-blue-100',
  'En corrección': 'bg-amber-50 text-amber-700 border-amber-100',
  Finalizado: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Entregado: 'bg-secondary/10 text-secondary border-secondary/20',
  Cancelado: 'bg-red-50 text-red-600 border-red-100',
};

const paymentClasses: Record<PaymentStatus, string> = {
  Pendiente: 'bg-amber-50 text-amber-700 border-amber-100',
  Parcial: 'bg-blue-50 text-blue-700 border-blue-100',
  Pagado: 'bg-secondary/10 text-secondary border-secondary/20',
};

export const StatusBadge = ({ status }: { status: JobStatus }) => (
  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${statusClasses[status]}`}>
    {status}
  </span>
);

export const PaymentBadge = ({ status }: { status: PaymentStatus }) => (
  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${paymentClasses[status]}`}>
    {status}
  </span>
);

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-white border border-dashed border-outline-variant rounded-2xl p-8 text-center">
    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
      <Icons.File className="w-6 h-6 text-slate-300" />
    </div>
    <h3 className="font-bold text-slate-700">{title}</h3>
    <p className="text-sm text-slate-400 mt-1">{description}</p>
  </div>
);
