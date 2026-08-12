import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import { formatDate } from './Common';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const pad = (value: number) => String(value).padStart(2, '0');
const toISO = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseISO = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month: month - 1, day };
};

const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const monthLabels = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const buildMonthGrid = (year: number, month: number) => {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - firstWeekday);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};

export const DatePicker = ({ value, onChange, placeholder = 'Selecciona una fecha', className }: DatePickerProps) => {
  const today = new Date();
  const parsed = parseISO(value);
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      const current = parseISO(value);
      setViewYear(current?.year ?? today.getFullYear());
      setViewMonth(current?.month ?? today.getMonth());
      const rect = containerRef.current?.getBoundingClientRect();
      setOpenUpward(!!rect && window.innerHeight - rect.bottom < 340 && rect.top > 340);
    }
    setOpen((current) => !current);
  };

  const goToMonth = (offset: number) => {
    const next = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const cells = buildMonthGrid(viewYear, viewMonth);
  const todayISO = toISO(today);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all flex items-center text-left ${className ?? 'w-full h-12'}`}
      >
        <span className={`text-sm font-medium truncate ${value ? 'text-slate-700' : 'text-slate-400'}`}>
          {value ? formatDate(value) : placeholder}
        </span>
      </button>
      <Icons.Calendar className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />

      {open && (
        <div className={`absolute z-20 ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => goToMonth(-1)} aria-label="Mes anterior" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors">
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-700">{monthLabels[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => goToMonth(1)} aria-label="Mes siguiente" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors">
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdayLabels.map((label) => (
              <span key={label} className="h-7 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date) => {
              const iso = toISO(date);
              const inMonth = date.getMonth() === viewMonth;
              const isSelected = iso === value;
              const isToday = iso === todayISO;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-white font-bold'
                      : inMonth
                        ? `text-slate-600 hover:bg-primary/10 ${isToday ? 'border border-primary/40' : ''}`
                        : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="mt-3 w-full h-8 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
              Limpiar fecha
            </button>
          )}
        </div>
      )}
    </div>
  );
};
