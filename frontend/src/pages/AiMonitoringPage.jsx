import { useEffect, useState } from 'react';
import Header from '../components/Header';
import GlobalFilters from '../components/filters/GlobalFilters';
import AiRiskCards from '../components/ai/AiRiskCards';
import AiCharts from '../components/ai/AiCharts';
import ErrorBanner from '../components/ui/ErrorBanner';
import { useFraudData } from '../context/FraudDataContext';
import { useFilters } from '../context/FilterContext';
import {
  fetchRiskAnalysis,
  fetchFraudInsights,
  fetchDataAnalysis,
  fetchMlMetrics,
} from '../services/api';
import { AI_SEVERITY_STYLES } from '../utils/formatters';

export default function AiMonitoringPage() {
  const { categories, loading: globalLoading, error: globalError, refetch } = useFraudData();
  const { queryParams } = useFilters();
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [risk, ins, data, metrics] = await Promise.all([
          fetchRiskAnalysis(queryParams),
          fetchFraudInsights(queryParams),
          fetchDataAnalysis(),
          fetchMlMetrics(),
        ]);
        if (!cancelled) {
          setRiskAnalysis(risk);
          setInsights(ins);
          setAnalysis(data);
          setMlMetrics(metrics);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [queryParams]);

  const displayError = error || globalError;

  return (
    <>
      <Header
        title="AI Risk Monitoring"
        subtitle="Machine learning fraud detection · anomaly scoring · behavioral intelligence"
        showAlert={(insights?.ai_alerts?.length ?? 0) > 0}
        alertMessage={
          insights?.ai_alerts?.[0]
            ? insights.ai_alerts[0].title
            : undefined
        }
      />

      {displayError && (
        <div className="mt-5">
          <ErrorBanner message={displayError} onRetry={refetch} />
        </div>
      )}

      <div className="mt-6 space-y-6">
        <GlobalFilters categories={categories} />

        <AiRiskCards
          riskAnalysis={riskAnalysis}
          insights={insights}
          mlMetrics={mlMetrics}
          loading={loading || globalLoading}
        />

        <AiCharts
          riskAnalysis={riskAnalysis}
          loading={loading || globalLoading}
        />

        {analysis?.insights && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
              Fraud Intelligence Insights
            </h3>
            <p className="mb-4 text-[11px] text-slate-400">
              Statistical analysis · {analysis.overview?.total_fraud_transactions?.toLocaleString()} records
            </p>
            <ul className="space-y-2">
              {analysis.insights.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50/60 dark:border-slate-700 dark:hover:bg-slate-800/50"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold ${AI_SEVERITY_STYLES[item.severity] ?? AI_SEVERITY_STYLES.INFO}`}
                  >
                    {item.severity}
                  </span>
                  <div>
                    <p className="text-[13px] text-slate-700 dark:text-slate-300">{item.message}</p>
                    <p className="text-[11px] text-slate-400">{item.type}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {insights?.ai_alerts && insights.ai_alerts.length > 0 && (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/30 p-5 dark:border-cyan-900 dark:bg-cyan-950/20">
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                Live AI Alerts
              </h3>
            </div>
            <ul className="space-y-2">
              {insights.ai_alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-lg border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${AI_SEVERITY_STYLES[alert.ai_severity] ?? AI_SEVERITY_STYLES.INFO}`}
                    >
                      {alert.ai_severity}
                    </span>
                    <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200">
                      {alert.title}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-slate-500">{alert.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
