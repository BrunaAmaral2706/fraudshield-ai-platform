export function formatNumber(value, decimals = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

export function formatCompact(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  if (num >= 1_000_000) return `$${formatCompact(num)}`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: num >= 1000 ? 0 : 2,
  }).format(num);
}

export function formatPercent(value, decimals = 2) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${formatNumber(value, decimals)}%`;
}

export function getCategoryName(item, index) {
  if (item?.category) return item.category;
  if (item?.category_raw) {
    return String(item.category_raw)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return `Category ${index + 1}`;
}

export function generateVolumeSeries(categoryData) {
  if (!categoryData?.length) return [];
  return categoryData.map((item, i) => ({
    name: getCategoryName(item, i),
    volume: item.volume_fraude ?? 0,
    frauds: item.qtd_fraudes ?? 0,
  }));
}

export function generateHourlySeries(hourData) {
  if (!hourData?.length) return [];
  return hourData.map((item, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    frauds: item.qtd_fraudes ?? 0,
  }));
}

export function generateHeatmapData(hourData) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const base = hourData?.length ? hourData.map((h) => h.qtd_fraudes ?? 0) : Array(24).fill(0);

  // Real hourly fraud counts — same API data shown per weekday row for heatmap visualization
  return days.flatMap((day) =>
    hours.map((hour) => ({
      day,
      hour,
      value: base[hour] ?? 0,
    })),
  );
}

export function generateVolumeTrend(categoryData) {
  if (!categoryData?.length) return [];
  let cumulative = 0;
  return categoryData.slice(0, 14).map((item, i) => {
    cumulative += item.volume_fraude ?? 0;
    return {
      index: i + 1,
      label: getCategoryName(item, i).slice(0, 6),
      volume: cumulative,
      daily: item.volume_fraude ?? 0,
    };
  });
}

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'review', label: 'Review' },
  { value: 'flagged', label: 'Flagged' },
];

export const RISK_LEVEL_STYLES = {
  CRITICAL: 'bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-400',
  MEDIUM: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-400',
  LOW: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400',
};

export const AI_SEVERITY_STYLES = {
  CRITICAL: 'bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-400',
  WARNING: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-400',
  INFO: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400',
};

export const ML_PREDICTION_STYLES = {
  FRAUD: 'bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-400',
  SUSPICIOUS: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400',
  LEGITIMATE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400',
};

export function formatProbability(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${(Number(value) * 100).toFixed(1)}%`;
}
