import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  generateHourlySeries,
  generateVolumeSeries,
  generateHeatmapData,
  generateVolumeTrend,
} from '../utils/formatters';
import { SkeletonChart } from './ui/Skeleton';
import EmptyState from './ui/EmptyState';
import AnimatedCard from './ui/AnimatedCard';
import { BarChart3 } from 'lucide-react';

const BAR_COLORS = [
  '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9',
  '#0891b2', '#0e7490', '#155e75', '#164e63',
  '#0891b2', '#06b6d4',
];

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 shadow-lg ${
        isDark
          ? 'border-slate-600 bg-slate-800 text-slate-100'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <p className="mb-1 text-[11px] font-medium text-slate-400">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-[13px] font-semibold" style={{ color: entry.color }}>
          {entry.name ?? entry.dataKey}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, count, children, delay = 0 }) {
  return (
    <AnimatedCard delay={delay}>
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)] dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>
            )}
          </div>
          {count && (
            <span className="text-[11px] font-medium text-slate-400">{count}</span>
          )}
        </div>
        {children}
      </div>
    </AnimatedCard>
  );
}

function Heatmap({ data, isDark }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const [hovered, setHovered] = useState(null);

  const getColor = (value) => {
    const intensity = value / maxVal;
    if (intensity > 0.75) return isDark ? 'bg-cyan-500' : 'bg-cyan-600';
    if (intensity > 0.5) return isDark ? 'bg-cyan-600/70' : 'bg-cyan-400';
    if (intensity > 0.25) return isDark ? 'bg-cyan-700/50' : 'bg-cyan-200';
    if (intensity > 0.1) return isDark ? 'bg-cyan-900/40' : 'bg-cyan-100';
    return isDark ? 'bg-slate-800' : 'bg-slate-50';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        {hovered && (
          <p className="mb-2 text-[11px] font-medium text-cyan-600 dark:text-cyan-400">
            {hovered.day} {hovered.hour}:00 — {hovered.value} events
          </p>
        )}
        <div className="mb-2 grid grid-cols-[32px_repeat(24,1fr)] gap-[2px]">
          <div />
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="text-center text-[9px] font-medium text-slate-400">
              {i % 4 === 0 ? `${i}h` : ''}
            </div>
          ))}
        </div>
        {days.map((day) => (
          <div key={day} className="mb-[2px] grid grid-cols-[32px_repeat(24,1fr)] gap-[2px]">
            <div className="flex items-center text-[10px] font-medium text-slate-500">{day}</div>
            {Array.from({ length: 24 }, (_, hour) => {
              const cell = data.find((d) => d.day === day && d.hour === hour);
              const value = cell?.value ?? 0;
              return (
                <div
                  key={hour}
                  className={`aspect-square cursor-crosshair rounded-[3px] transition-all duration-150 hover:scale-110 hover:ring-1 hover:ring-cyan-400 ${getColor(value)}`}
                  onMouseEnter={() => setHovered({ day, hour, value })}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </div>
        ))}
        <div className="mt-3 flex items-center justify-end gap-2">
          <span className="text-[10px] text-slate-400">Low</span>
          <div className="flex gap-[2px]">
            {(isDark
              ? ['bg-slate-800', 'bg-cyan-900/40', 'bg-cyan-700/50', 'bg-cyan-600/70', 'bg-cyan-500']
              : ['bg-slate-50', 'bg-cyan-100', 'bg-cyan-200', 'bg-cyan-400', 'bg-cyan-600']
            ).map((c) => (
              <div key={c} className={`h-3 w-5 rounded-sm ${c}`} />
            ))}
          </div>
          <span className="text-[10px] text-slate-400">High</span>
        </div>
      </div>
    </div>
  );
}

export default function Charts({ hourData, categoryData, loading, variant = 'full' }) {
  const { isDark } = useTheme();

  if (loading) {
    const count = variant === 'overview' ? 2 : 4;
    return (
      <div className={`grid grid-cols-1 gap-4 ${variant === 'full' ? 'xl:grid-cols-2' : ''}`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonChart key={i} />
        ))}
      </div>
    );
  }

  if (!hourData?.length && !categoryData?.length) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No chart data"
        description="Fraud analytics data could not be loaded from the API."
      />
    );
  }

  const hourlySeries = generateHourlySeries(hourData);
  const categorySeries = generateVolumeSeries(categoryData).slice(0, 10);
  const volumeTrend = generateVolumeTrend(categoryData);
  const heatmapData = generateHeatmapData(hourData);

  const gridStroke = isDark ? '#334155' : '#f1f5f9';
  const tickColor = isDark ? '#64748b' : '#94a3b8';

  if (variant === 'overview') {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Frauds by Hour" subtitle="24-hour timeline" delay={0}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hourlySeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Line type="monotone" dataKey="frauds" name="Frauds" stroke="#0891b2" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Frauds by Category" subtitle="Top categories" delay={100}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categorySeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: tickColor }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(241,245,249,0.8)' }} />
              <Bar dataKey="frauds" name="Frauds" radius={[4, 4, 0, 0]} maxBarSize={32} animationDuration={800}>
                {categorySeries.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Frauds by Hour" subtitle="24-hour fraud detection timeline" count={`${hourlySeries.length} pts`} delay={0}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={hourlySeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Line type="monotone" dataKey="frauds" name="Frauds" stroke="#0891b2" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }} animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Frauds by Category" subtitle="Top categories by fraud volume" count={`${categorySeries.length} categories`} delay={100}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categorySeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: tickColor }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(241,245,249,0.8)' }} />
              <Bar dataKey="frauds" name="Frauds" radius={[4, 4, 0, 0]} maxBarSize={32} animationDuration={1000}>
                {categorySeries.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Financial Volume" subtitle="Cumulative fraud volume by category" delay={200}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={volumeTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Area type="monotone" dataKey="volume" name="Volume" stroke="#0891b2" strokeWidth={2} fill="url(#volumeGradient)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Activity" subtitle="Fraud intensity by day and hour" count="7 × 24 grid" delay={300}>
          <Heatmap data={heatmapData} isDark={isDark} />
        </ChartCard>
      </div>
    </div>
  );
}
