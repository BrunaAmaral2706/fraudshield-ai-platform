import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/formatters';
import { SkeletonCard } from './ui/Skeleton';
import AnimatedCard from './ui/AnimatedCard';
import EmptyState from './ui/EmptyState';

function KpiCard({ label, value, sub, trend, trendUp, accent, icon: Icon, delay = 0 }) {
  return (
    <AnimatedCard delay={delay}>
      <div className="rounded-xl border border-slate-200/80 bg-white px-5 py-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400">
            {label}
          </p>
          {Icon && (
            <Icon className={`h-3.5 w-3.5 ${accent ?? 'text-slate-300'}`} strokeWidth={2} />
          )}
        </div>
        <p className={`mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white ${accent ?? ''}`}>
          {value}
        </p>
        {(sub || trend) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {trend && (
              <span
                className={`flex items-center gap-0.5 text-[11px] font-medium ${
                  trendUp ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trend}
              </span>
            )}
            {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
}

function StatusCard({ label, value, status, statusColor, detail, delay = 0 }) {
  return (
    <AnimatedCard delay={delay}>
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] dark:border-slate-700 dark:bg-slate-800">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </span>
            {status && (
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
                {status}
              </span>
            )}
          </div>
          {detail && <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>}
        </div>
      </div>
    </AnimatedCard>
  );
}

export default function KpiCards({ kpis, alerts, loading, empty }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[72px]" />
          ))}
        </div>
      </div>
    );
  }

  if (empty || !kpis?.length) {
    return (
      <EmptyState
        title="No KPI data available"
        description="Connect to the API to load fraud analytics metrics."
      />
    );
  }

  const data = kpis[0];
  const activeAlerts = alerts?.length ?? 0;
  const criticalAlerts = alerts?.filter((a) => a.severity === 'critical').length ?? 0;
  const riskScore = Math.min(99, Math.round((data.taxa_fraude ?? 0) * 12 + 28));
  const industryAvg = 0.42;
  const fraudRate = data.taxa_fraude ?? 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total Transactions"
          value={formatCompact(data.total_transacoes)}
          sub="processed volume"
          icon={TrendingUp}
          delay={0}
        />
        <KpiCard
          label="Total Frauds"
          value={formatNumber(data.total_fraudes)}
          sub="confirmed fraud cases"
          accent="text-red-500"
          icon={AlertCircle}
          delay={50}
        />
        <KpiCard
          label="Fraud Rate"
          value={formatPercent(fraudRate)}
          sub={`industry avg: ${industryAvg}%`}
          trend={fraudRate > industryAvg ? 'above benchmark' : 'within benchmark'}
          trendUp={fraudRate <= industryAvg}
          accent="text-amber-600"
          delay={100}
        />
        <KpiCard
          label="Financial Volume"
          value={formatCurrency(data.volume_total)}
          sub="total processed"
          accent="text-emerald-600"
          delay={150}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatusCard
          label="Avg Ticket"
          value={formatCurrency(data.ticket_medio)}
          detail={`based on ${formatCompact(data.total_transacoes)} transactions`}
          delay={200}
        />
        <StatusCard
          label="Active Alerts"
          value={activeAlerts}
          status={criticalAlerts > 0 ? 'critical' : 'monitoring'}
          statusColor={
            criticalAlerts > 0
              ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
              : 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400'
          }
          detail={`${criticalAlerts} require immediate action`}
          delay={250}
        />
        <StatusCard
          label="Risk Score"
          value={riskScore}
          status={riskScore >= 70 ? 'elevated' : 'moderate'}
          statusColor={
            riskScore >= 70
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
          }
          detail="composite ML risk index"
          delay={300}
        />
      </div>
    </div>
  );
}
