import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from './Common';
import type { Job } from '../types';

interface MonthlyActivity {
  month: string;
  ingresados: number;
  entregados: number;
}

const MONTHS_TO_SHOW = 6;

const parseFlexibleDate = (value?: string) => {
  if (!value) return undefined;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const buildMonthlyActivity = (jobs: Job[], reference: Date = new Date()): MonthlyActivity[] => {
  const months = Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
    const date = new Date(reference.getFullYear(), reference.getMonth() - (MONTHS_TO_SHOW - 1 - index), 1);
    const label = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(date).replace(/\.$/, '');
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: label,
      ingresados: 0,
      entregados: 0,
    };
  });

  const indexByKey = new Map(months.map((entry, index) => [entry.key, index]));

  jobs.forEach((job) => {
    const entryDate = parseFlexibleDate(job.entryDate);
    if (entryDate) {
      const key = `${entryDate.getFullYear()}-${entryDate.getMonth()}`;
      const index = indexByKey.get(key);
      if (index !== undefined) months[index].ingresados += 1;
    }

    if (job.status === 'Entregado') {
      const deliveryDate = parseFlexibleDate(job.realDeliveryDate) ?? parseFlexibleDate(job.updatedAt);
      if (deliveryDate) {
        const key = `${deliveryDate.getFullYear()}-${deliveryDate.getMonth()}`;
        const index = indexByKey.get(key);
        if (index !== undefined) months[index].entregados += 1;
      }
    }
  });

  return months.map(({ key: _key, ...rest }) => rest);
};

const ChartTooltip = ({ active, payload, label }: {
  active?: boolean;
  label?: string;
  payload?: { name: string; value: number; color: string }[];
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-slate-700 uppercase tracking-wide mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-slate-600">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-bold text-slate-800">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export const ActivityChart = ({ jobs }: { jobs: Job[] }) => {
  const data = useMemo(() => buildMonthlyActivity(jobs), [jobs]);

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="Sin actividad registrada"
        description="Cuando registres trabajos, aquí verás la comparación de ingresos y entregas mes a mes."
      />
    );
  }

  return (
    <div className="h-[240px] md:h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-outline)', fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-outline)', fontSize: 12 }}
            width={32}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-surface-container)' }} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, fontWeight: 600, color: 'var(--color-outline)' }}
          />
          <Bar
            dataKey="ingresados"
            name="Ingresados"
            fill="var(--color-primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="entregados"
            name="Entregados"
            fill="var(--color-secondary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
