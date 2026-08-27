import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useDentalFlow } from '../context/DentalFlowContext';
import { useJobFormModal } from '../context/JobFormModalContext';
import type { AppointmentStatus, JobStatus, PaymentStatus } from '../types';

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

const statsCardColors: Record<StatsCardColor, { text: string; bg: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary/10' },
  secondary: { text: 'text-secondary', bg: 'bg-secondary/10' },
  tertiary: { text: 'text-tertiary', bg: 'bg-tertiary/10' },
  error: { text: 'text-red-600', bg: 'bg-red-50' },
};

export const StatsCard = ({ title, value, trend, trendValue, icon: Icon, color = 'primary' }: StatsCardProps) => {
  const isPositive = trend === 'up';
  const palette = statsCardColors[color];

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-outline-variant card-hover flex flex-col gap-2.5 min-h-[112px]">
      <div className="flex justify-between items-start gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">{title}</span>
        {Icon && (
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${palette.bg}`}>
            <Icon className={`w-4 h-4 ${palette.text}`} />
          </span>
        )}
      </div>
      <span className="text-xl sm:text-2xl font-bold break-words truncate text-slate-800">{value}</span>
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
    <header className="flex justify-between items-center min-h-16 px-4 md:px-8 w-full z-40 sticky top-0 glass border-b border-outline-variant">
      <div className="min-w-0 pr-3">
        <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-800 truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {showCreate && (
          <button
            type="button"
            onClick={() => openCreateJob()}
            className="bg-primary text-white px-3 sm:px-4 py-2 rounded-xl font-bold hover:bg-primary-container transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-primary/25"
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
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
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

type Tone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Los estados usan tonos semánticos fijos (no cambian con el tema del cliente),
 * salvo los marcados como "brand", que sí siguen el color de la cuenta.
 */
const toneClasses: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  brand: { badge: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary' },
  info: { badge: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  success: { badge: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  warning: { badge: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  danger: { badge: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger' },
};

const jobStatusTones: Record<JobStatus, Tone> = {
  Recibido: 'neutral',
  'En proceso': 'info',
  'En corrección': 'warning',
  Finalizado: 'success',
  Entregado: 'brand',
  Cancelado: 'danger',
};

const paymentTones: Record<PaymentStatus, Tone> = {
  Pendiente: 'warning',
  Parcial: 'info',
  Pagado: 'success',
};

const appointmentTones: Record<AppointmentStatus, Tone> = {
  Programada: 'brand',
  Confirmada: 'success',
  Completada: 'info',
  Cancelada: 'danger',
  'No asistió': 'warning',
};

const badgeBase = 'inline-flex items-center gap-1.5 justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap';

const ToneBadge = ({ tone, label, dot = true }: { tone: Tone; label: string; dot?: boolean }) => (
  <span className={`${badgeBase} ${toneClasses[tone].badge}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${toneClasses[tone].dot}`} />}
    {label}
  </span>
);

export const StatusBadge = ({ status }: { status: JobStatus }) => (
  <ToneBadge tone={jobStatusTones[status]} label={status} />
);

export const PaymentBadge = ({ status }: { status: PaymentStatus }) => (
  <ToneBadge tone={paymentTones[status]} label={status} />
);

/**
 * FullCalendar pinta los eventos con estilos en línea, por eso aquí van
 * colores CSS resueltos y no clases de Tailwind. Las expresiones oklch leen
 * las variables del tema, así los eventos "Programada" siguen la marca.
 */
export const appointmentStatusColors: Record<AppointmentStatus, { bg: string; text: string }> = {
  Programada: { bg: 'oklch(0.94 calc(var(--brand-c) * 0.2) var(--brand-h))', text: 'oklch(0.4 var(--brand-c) var(--brand-h))' },
  Confirmada: { bg: 'oklch(0.93 0.05 163)', text: 'oklch(0.45 0.13 163)' },
  Completada: { bg: 'oklch(0.93 0.05 258)', text: 'oklch(0.45 0.2 258)' },
  Cancelada: { bg: 'oklch(0.93 0.05 27)', text: 'oklch(0.48 0.21 27)' },
  'No asistió': { bg: 'oklch(0.93 0.06 58)', text: 'oklch(0.47 0.15 58)' },
};

export const AppointmentStatusBadge = ({ status }: { status: AppointmentStatus }) => (
  <ToneBadge tone={appointmentTones[status]} label={status} dot={false} />
);

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-white border border-dashed border-outline-variant rounded-2xl p-8 text-center">
    <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
      <Icons.File className="w-6 h-6 text-primary/40" />
    </div>
    <h3 className="font-bold text-slate-700">{title}</h3>
    <p className="text-sm text-slate-400 mt-1">{description}</p>
  </div>
);
