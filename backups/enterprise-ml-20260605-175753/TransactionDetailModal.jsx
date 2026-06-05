import { X, MapPin, CreditCard, Clock, Shield, AlertTriangle, Brain, Sparkles } from 'lucide-react';
import { RISK_LEVEL_STYLES, ML_PREDICTION_STYLES, AI_SEVERITY_STYLES, formatProbability } from '../../utils/formatters';

const STATUS_STYLES = {
  blocked: 'bg-red-50 text-red-600 ring-red-100',
  review: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  flagged: 'bg-amber-50 text-amber-700 ring-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

function formatAmount(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  const statusClass = STATUS_STYLES[transaction.status] ?? STATUS_STYLES.flagged;
  const riskClass = RISK_LEVEL_STYLES[transaction.risk_level] ?? RISK_LEVEL_STYLES.MEDIUM;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-lg animate-[fadeIn_0.2s_ease-out] rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-600">
              Transaction Details
            </p>
            <h2 id="tx-modal-title" className="mt-1 font-mono text-[15px] font-semibold text-slate-900 dark:text-white">
              {transaction.transaction_id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <DetailItem icon={CreditCard} label="Amount" value={formatAmount(transaction.amount)} highlight />
            <DetailItem icon={Shield} label="Risk Score" value={transaction.risk_score} />
            <DetailItem icon={Clock} label="Timestamp" value={formatTimestamp(transaction.timestamp)} />
            <DetailItem icon={MapPin} label="Region" value={transaction.region ?? '—'} />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold tracking-wide ${riskClass}`}>
              {transaction.risk_level}
            </span>
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusClass}`}>
              {transaction.status}
            </span>
            {transaction.alert_level && (
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700 ring-1 ring-orange-100">
                <AlertTriangle className="h-3 w-3" />
                {transaction.alert_level}
              </span>
            )}
            {transaction.ml_prediction && (
              <span className={`rounded-md px-2 py-1 text-[10px] font-bold tracking-wide ${ML_PREDICTION_STYLES[transaction.ml_prediction]}`}>
                ML: {transaction.ml_prediction}
              </span>
            )}
            {transaction.severity && (
              <span className={`rounded-md px-2 py-1 text-[10px] font-bold tracking-wide ${AI_SEVERITY_STYLES[transaction.severity]}`}>
                {transaction.severity}
              </span>
            )}
          </div>

          {(transaction.fraud_probability != null || transaction.ai_confidence != null) && (
            <div className="grid grid-cols-3 gap-2">
              <MiniMetric label="Fraud Prob." value={formatProbability(transaction.fraud_probability)} />
              <MiniMetric label="Anomaly" value={formatNumber(transaction.anomaly_score)} />
              <MiniMetric label="AI Confidence" value={`${transaction.ai_confidence ?? '—'}%`} />
            </div>
          )}

          {transaction.risk_explanation?.factors?.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                Risk Explanation
              </div>
              <p className="text-[13px] text-slate-700 dark:text-slate-300">
                {transaction.risk_explanation.summary}
              </p>
              <ul className="mt-2 space-y-1.5">
                {transaction.risk_explanation.factors.map((f) => (
                  <li key={f.factor} className="flex items-start gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                    <Brain className="mt-0.5 h-3 w-3 shrink-0 text-cyan-600" />
                    <span>
                      <strong>{f.label}</strong> — {f.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <dl className="grid grid-cols-1 gap-2 text-[13px]">
              <Row label="Category" value={transaction.category} />
              <Row label="Merchant" value={transaction.merchant ?? '—'} />
              <Row label="City / State" value={[transaction.city, transaction.state].filter(Boolean).join(', ') || '—'} />
              <Row label="Card (masked)" value={transaction.cc_num ? `•••• ${String(transaction.cc_num).slice(-4)}` : '—'} />
            </dl>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-cyan-500"
          >
            Flag for Review
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, highlight }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-700">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-1 text-[14px] font-semibold ${highlight ? 'text-cyan-600' : 'text-slate-800 dark:text-slate-200'}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-2.5 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}

function formatNumber(v) {
  if (v == null) return '—';
  return Number(v).toFixed(2);
}
