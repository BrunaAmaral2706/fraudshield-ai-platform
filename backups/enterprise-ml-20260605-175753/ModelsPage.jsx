import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';
import { useFraudData } from '../context/FraudDataContext';
import { fetchMlPipeline, fetchMlMetrics } from '../services/api';
import { BrainCircuit } from 'lucide-react';

const STATUS_STYLES = {
  healthy: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400',
  alerting: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400',
  degraded: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400',
};

function buildSparkline(accuracy) {
  const base = accuracy - 1;
  return Array.from({ length: 7 }, (_, i) => ({
    v: Number((base + (i * 0.3) + (i % 2 ? 0.2 : -0.1)).toFixed(1)),
  }));
}

export default function ModelsPage() {
  const { models, loading, error, refetch } = useFraudData();
  const [pipeline, setPipeline] = useState(null);
  const [mlMetrics, setMlMetrics] = useState(null);

  useEffect(() => {
    fetchMlPipeline().then(setPipeline).catch(() => setPipeline(null));
    fetchMlMetrics().then(setMlMetrics).catch(() => setMlMetrics(null));
  }, []);

  return (
    <>
      <Header
        title="ML Models"
        subtitle={`${models?.length ?? 0} models deployed · monitoring accuracy, latency & drift`}
        showAlert={false}
      />

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onRetry={refetch} />
        </div>
      )}

      <div className="mt-6 space-y-6">
        {pipeline && (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-5 dark:border-cyan-900 dark:bg-cyan-950/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                  ML Pipeline · {pipeline.algorithm}
                </p>
                <h3 className="mt-1 text-[15px] font-semibold text-slate-900 dark:text-white">
                  {pipeline.name} v{pipeline.version}
                </h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {pipeline.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {pipeline.stages?.map((stage) => (
                <span
                  key={stage.stage}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {stage.stage} · {stage.status}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonTable rows={6} />
        ) : !models?.length ? (
          <EmptyState
            icon={BrainCircuit}
            title="No models available"
            description="Model health data could not be loaded from the API."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
              <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Model Health</h3>
              <span className="text-[11px] font-medium text-slate-400">{models.length} models</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Model', 'Status', 'Accuracy', 'P99 Latency', '7d Trend', 'Alerts', 'Last Retrain'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {models.map((model, idx) => {
                    const isAlerting = model.status === 'alerting';
                    const sparkData = buildSparkline(model.accuracy);
                    return (
                      <tr
                        key={model.name}
                        className={`animate-fade-in border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60 dark:border-slate-700/50 dark:hover:bg-slate-700/30 ${
                          isAlerting ? 'bg-cyan-50/30 dark:bg-cyan-950/15' : ''
                        }`}
                        style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                      >
                        <td className="relative px-5 py-4">
                          {isAlerting && (
                            <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-cyan-500" />
                          )}
                          <span className="font-mono text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                            {model.name}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[model.status] ?? STATUS_STYLES.healthy}`}
                          >
                            {model.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-[13px] font-medium text-slate-700 dark:text-slate-300">
                            {model.accuracy}%
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-[13px] text-slate-600 dark:text-slate-400">
                            {model.latency}ms
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-8 w-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={sparkData}>
                                <Line
                                  type="monotone"
                                  dataKey="v"
                                  stroke={isAlerting ? '#f59e0b' : '#0891b2'}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {model.alerts > 0 ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                              {model.alerts}
                            </span>
                          ) : (
                            <span className="text-[12px] text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[12px] text-slate-400">{model.lastTrain}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mlMetrics?.metrics && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
              Model Performance Metrics
            </h3>
            <p className="mb-4 text-[11px] text-slate-400">
              Ensemble evaluation · {mlMetrics.summary?.total_scored?.toLocaleString()} samples scored
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: 'Precision', value: mlMetrics.metrics.precision },
                { label: 'Recall', value: mlMetrics.metrics.recall },
                { label: 'F1-Score', value: mlMetrics.metrics.f1_score },
                { label: 'Accuracy', value: mlMetrics.metrics.accuracy },
                { label: 'AUC-ROC', value: mlMetrics.metrics.auc_roc },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-700 dark:bg-slate-900/50"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {m.label}
                  </p>
                  <p className="mt-1 font-mono text-[18px] font-bold text-cyan-600">
                    {(m.value * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
            {mlMetrics.confusion_matrix && (
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[12px]">
                {[
                  { k: 'TP', v: mlMetrics.confusion_matrix.tp },
                  { k: 'FP', v: mlMetrics.confusion_matrix.fp },
                  { k: 'FN', v: mlMetrics.confusion_matrix.fn },
                  { k: 'TN', v: mlMetrics.confusion_matrix.tn },
                ].map((c) => (
                  <div key={c.k} className="rounded-lg border border-slate-100 py-2 dark:border-slate-700">
                    <span className="font-bold text-slate-500">{c.k}</span>
                    <p className="font-mono text-[15px] font-semibold text-slate-800 dark:text-white">{c.v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
