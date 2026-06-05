import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SkeletonChart } from '../ui/Skeleton';
import { AI_SEVERITY_STYLES } from '../../utils/formatters';

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  WARNING: '#f59e0b',
  INFO: '#94a3b8',
};

const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 12,
};

export default function AiCharts({ riskAnalysis, insights, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  const severityData =
    riskAnalysis?.severity_distribution?.map((s) => ({
      name: s.severity,
      count: s.count,
      fill: SEVERITY_COLORS[s.severity] ?? '#94a3b8',
    })) ?? [];

  const mlData = insights?.ml_distribution
    ? Object.entries(insights.ml_distribution).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  const timelineData =
    riskAnalysis?.top_risk_transactions?.slice(0, 8).map((t, i) => ({
      index: i + 1,
      probability: Number((t.fraud_probability * 100).toFixed(1)),
      risk: t.risk_score,
    })) ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
          Anomaly Distribution
        </h3>
        <p className="mb-4 text-[11px] text-slate-400">AI severity classification</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.keys(AI_SEVERITY_STYLES).map((sev) => (
            <span
              key={sev}
              className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${AI_SEVERITY_STYLES[sev]}`}
            >
              {sev}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
          Threat Timeline
        </h3>
        <p className="mb-4 text-[11px] text-slate-400">Top risk — fraud probability %</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="index" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="probability"
                stroke="#0891b2"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0891b2' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {mlData.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] lg:col-span-2 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
            ML Prediction Distribution
          </h3>
          <p className="mb-4 text-[11px] text-slate-400">Ensemble model output</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mlData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#0891b2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
