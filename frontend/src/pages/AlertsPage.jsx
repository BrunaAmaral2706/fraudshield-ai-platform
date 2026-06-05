import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';
import EmptyState from '../components/ui/EmptyState';
import ErrorBanner from '../components/ui/ErrorBanner';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Skeleton } from '../components/ui/Skeleton';
import { useFraudData } from '../context/FraudDataContext';

const SEVERITY = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-100 dark:border-red-900/50',
    badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  },
  high: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-100 dark:border-amber-900/50',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  medium: {
    icon: Info,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-100 dark:border-cyan-900/50',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  },
  low: {
    icon: CheckCircle2,
    color: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-100 dark:border-slate-700',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  },
};

const FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

export default function AlertsPage() {
  const { alerts, loading, error, refetch } = useFraudData();
  const [filter, setFilter] = useState('all');

  const filtered =
    filter === 'all'
      ? alerts ?? []
      : (alerts ?? []).filter((a) => a.severity === filter);

  const criticalCount = (alerts ?? []).filter((a) => a.severity === 'critical').length;

  return (
    <>
      <Header
        title="Alerts"
        subtitle={`${alerts?.length ?? 0} active alerts · ${criticalCount} critical`}
        showAlert={false}
        showExport={false}
      />

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onRetry={refetch} />
        </div>
      )}

      <div className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-cyan-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'All alerts' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No alerts match this filter"
            description="All clear — no alerts with the selected severity level."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((alert, i) => {
              const sev = SEVERITY[alert.severity] ?? SEVERITY.medium;
              const Icon = sev.icon;
              return (
                <AnimatedCard key={alert.id} delay={i * 60}>
                  <div
                    className={`flex items-start gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md ${sev.bg} ${sev.border}`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-900/50">
                      <Icon className={`h-4 w-4 ${sev.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">{alert.id}</span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${sev.badge}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[11px] text-slate-400">{alert.time}</span>
                      </div>
                      <h3 className="mt-1 text-[14px] font-semibold text-slate-900 dark:text-white">
                        {alert.title}
                      </h3>
                      <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                        {alert.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/60 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-900/40">
                      {alert.category}
                    </span>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
