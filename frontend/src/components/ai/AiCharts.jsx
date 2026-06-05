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
import { RISK_LEVEL_STYLES } from '../../utils/formatters';

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 12,
};

function ChartPanel({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mb-4 text-[11px] text-slate-400">{subtitle}</p>
      {children}
    </div>
  );
}

export default function AiCharts({ riskAnalysis, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonChart key={i} />
        ))}
      </div>
    );
  }

  const riskData =
    riskAnalysis?.risk_distribution?.map((r) => ({
      name: r.level,
      count: r.count,
      fill: RISK_COLORS[r.level] ?? '#94a3b8',
    })) ?? [];

  const probTrend = riskAnalysis?.charts?.probability_trend ?? [];
  const confTrend = riskAnalysis?.charts?.confidence_trend ?? [];
  const anomalyTimeline = riskAnalysis?.charts?.anomaly_timeline ?? [];
  const heatmap = riskAnalysis?.charts?.risk_heatmap ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartPanel title="Risk Distribution" subtitle="LOW · MEDIUM · HIGH · CRITICAL">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.keys(RISK_LEVEL_STYLES).map((level) => (
              <span
                key={level}
                className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${RISK_LEVEL_STYLES[level]}`}
              >
                {level}
              </span>
            ))}
          </div>
        </ChartPanel>

        <ChartPanel title="Fraud Probability Trend" subtitle="Average probability by hour">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={probTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${(v * 100).toFixed(1)}%`, 'Prob.']} />
                <Line type="monotone" dataKey="avg" stroke="#0891b2" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Anomaly Timeline" subtitle="Top flagged transactions">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomalyTimeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="anomaly" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="AI Confidence Trend" subtitle="Model confidence by hour">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={confTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} domain={[50, 100]} unit="%" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </div>

      {heatmap.length > 0 && (
        <ChartPanel title="Risk Heatmap" subtitle="Average risk score by day × time window" className="lg:col-span-2">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmap.slice(0, 28)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      )}
    </div>
  );
}
