import { Brain, ShieldAlert, Activity, Target, AlertTriangle, Gauge } from 'lucide-react';
import AnimatedCard from '../ui/AnimatedCard';
import { SkeletonCard } from '../ui/Skeleton';
import { formatNumber, formatProbability } from '../../utils/formatters';

function AiCard({ label, value, sub, icon: Icon, accent, delay = 0, pulse }) {
  return (
    <AnimatedCard delay={delay}>
      <div className="rounded-xl border border-slate-200/80 bg-white px-5 py-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400">
            {label}
          </p>
          <div className="relative">
            {pulse && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            )}
            <Icon className={`h-3.5 w-3.5 ${accent ?? 'text-cyan-600'}`} strokeWidth={2} />
          </div>
        </div>
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
      </div>
    </AnimatedCard>
  );
}

export default function AiRiskCards({ riskAnalysis, insights, mlMetrics, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const summary = riskAnalysis?.summary ?? {};
  const anomaly = insights?.anomaly_summary ?? {};
  const accuracy = summary.ai_accuracy ?? mlMetrics?.metrics?.accuracy;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <AiCard
        label="AI Confidence"
        value={`${formatNumber(summary.avg_ai_confidence ?? anomaly.avg_confidence ?? 0, 1)}%`}
        sub="Model ensemble confidence"
        icon={Target}
        accent="text-emerald-600"
        delay={0}
        pulse
      />
      <AiCard
        label="High Risk Transactions"
        value={formatNumber(summary.high_risk_count ?? 0)}
        sub={`${summary.critical_count ?? 0} critical`}
        icon={ShieldAlert}
        accent="text-orange-500"
        delay={50}
      />
      <AiCard
        label="Fraud Probability"
        value={formatProbability(summary.avg_fraud_probability)}
        sub="Average across filter"
        icon={Brain}
        accent="text-cyan-600"
        delay={100}
      />
      <AiCard
        label="Anomalies Detected"
        value={formatNumber(anomaly.anomalies ?? 0)}
        sub={`Score avg ${formatNumber((anomaly.avg_anomaly_score ?? 0) * 100, 1)}%`}
        icon={Activity}
        accent="text-amber-500"
        delay={150}
      />
      <AiCard
        label="Critical Alerts"
        value={formatNumber(insights?.ai_alerts?.filter((a) => a.ai_severity === 'CRITICAL').length ?? summary.critical_count ?? 0)}
        sub="AI-generated signals"
        icon={AlertTriangle}
        accent="text-red-500"
        delay={200}
        pulse
      />
      <AiCard
        label="AI Accuracy"
        value={accuracy != null ? `${(accuracy * 100).toFixed(1)}%` : '—'}
        sub={`F1 ${((mlMetrics?.metrics?.f1_score ?? 0) * 100).toFixed(1)}%`}
        icon={Gauge}
        accent="text-violet-600"
        delay={250}
      />
    </div>
  );
}
