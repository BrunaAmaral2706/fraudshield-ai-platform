/**
 * Filter utilities — client-side mirror of backend/lib/filters.js for GitHub Pages demo.
 */

const PERIOD_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export function parseFilters(query = {}) {
  return {
    search: String(query.search ?? '').toLowerCase().trim(),
    status: query.status ?? 'all',
    category: query.category ?? 'all',
    risk_level: query.risk_level ?? query.riskLevel ?? 'all',
    period: query.period ?? 'all',
    region: query.region ?? 'all',
    page: Math.max(1, parseInt(query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20)),
    sort: query.sort ?? 'timestamp',
    order: query.order ?? 'desc',
  };
}

function filterByPeriod(transactions, period) {
  if (!period || period === 'all' || !transactions.length) return transactions;

  const ms = PERIOD_MS[period];
  if (!ms) return transactions;

  const maxTime = Math.max(
    ...transactions.map((tx) => new Date(tx.timestamp).getTime()).filter(Boolean),
  );
  const cutoff = maxTime - ms;

  return transactions.filter((tx) => {
    const t = new Date(tx.timestamp).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

export function applyTransactionFilters(transactions, filters) {
  let rows = [...transactions];

  rows = filterByPeriod(rows, filters.period);

  if (filters.search) {
    rows = rows.filter(
      (tx) =>
        tx.transaction_id.toLowerCase().includes(filters.search) ||
        tx.category.toLowerCase().includes(filters.search) ||
        (tx.category_raw && tx.category_raw.toLowerCase().includes(filters.search)) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(filters.search)),
    );
  }

  if (filters.status !== 'all') {
    rows = rows.filter((tx) => tx.status === filters.status);
  }

  if (filters.category !== 'all') {
    rows = rows.filter(
      (tx) =>
        tx.category === filters.category ||
        tx.category_raw === filters.category ||
        tx.category_raw === filters.category.replace(/ /g, '_').toLowerCase(),
    );
  }

  if (filters.risk_level !== 'all') {
    rows = rows.filter((tx) => tx.risk_level === filters.risk_level.toUpperCase());
  }

  if (filters.region !== 'all') {
    rows = rows.filter((tx) => tx.region === filters.region);
  }

  return rows;
}

export function sortTransactions(rows, sort, order) {
  const dir = order === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort === 'amount') return (a.amount - b.amount) * dir;
    if (sort === 'risk_score') return (a.risk_score - b.risk_score) * dir;
    if (sort === 'category') return a.category.localeCompare(b.category) * dir;
    if (sort === 'risk_level') return a.risk_level.localeCompare(b.risk_level) * dir;
    return (new Date(a.timestamp) - new Date(b.timestamp)) * dir;
  });
}

export function paginate(rows, page, limit) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    pagination: { page: safePage, limit, total, totalPages },
  };
}

export function computeKpisFromTransactions(transactions, globalKpis) {
  if (!transactions.length && globalKpis?.[0]) {
    return globalKpis;
  }

  const total_fraudes = transactions.length;
  const volume_total = transactions.reduce((s, t) => s + t.amount, 0);
  const ticket_medio = total_fraudes ? volume_total / total_fraudes : 0;
  const baseTotal = globalKpis?.[0]?.total_transacoes ?? total_fraudes;
  const taxa_fraude = baseTotal ? (total_fraudes / baseTotal) * 100 : 0;

  return [
    {
      total_transacoes: baseTotal,
      total_fraudes,
      taxa_fraude,
      volume_total,
      ticket_medio,
      filtered: true,
    },
  ];
}

export function computeCategoriesFromTransactions(transactions) {
  const map = new Map();
  transactions.forEach((tx) => {
    const key = tx.category_raw || tx.category;
    const prev = map.get(key) || {
      qtd_fraudes: 0,
      volume_fraude: 0,
      category: tx.category,
      category_raw: tx.category_raw,
    };
    map.set(key, {
      ...prev,
      qtd_fraudes: prev.qtd_fraudes + 1,
      volume_fraude: prev.volume_fraude + tx.amount,
    });
  });
  return Array.from(map.values()).sort((a, b) => b.qtd_fraudes - a.qtd_fraudes);
}

export function computeHoursFromTransactions(transactions) {
  const hours = Array.from({ length: 24 }, () => ({ qtd_fraudes: 0 }));
  transactions.forEach((tx) => {
    const h = tx.hour ?? 0;
    if (h >= 0 && h < 24) hours[h].qtd_fraudes += 1;
  });
  return hours;
}

function mean(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

export function buildSummary(filtered, dataset, allTransactions, globalKpis) {
  const avg = (arr) => (arr.length ? mean(arr) : 0);

  return {
    kpis: dataset.kpis[0],
    totals: {
      transactions: filtered.length,
      categories: dataset.categories.length,
      alerts: dataset.alerts.length,
    },
    risk_distribution: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => ({
      level,
      count: filtered.filter((t) => t.risk_level === level).length,
    })),
    ml_summary: {
      avg_risk_score: Number(avg(filtered.map((t) => t.risk_score ?? 0)).toFixed(2)),
      avg_fraud_probability: Number(avg(filtered.map((t) => t.fraud_probability ?? 0)).toFixed(4)),
      avg_ai_confidence: Number(avg(filtered.map((t) => t.ai_confidence ?? 0)).toFixed(2)),
      high_risk_count: filtered.filter((t) => t.risk_level === 'HIGH' || t.risk_level === 'CRITICAL').length,
      anomalies_detected: filtered.filter((t) => (t.anomaly_score ?? 0) >= 0.55).length,
    },
    regions: [
      'all',
      ...new Set((allTransactions ?? []).map((t) => t.region).filter(Boolean)),
    ],
    meta: { applied: dataset.filters, static: true },
  };
}

export function buildDemoAlerts(filtered, kpis, hours, categories) {
  const alerts = [];
  const fraudRate = kpis?.[0]?.taxa_fraude ?? 0;

  if (fraudRate > 0.5) {
    alerts.push({
      id: 'ALT-RATE',
      severity: 'critical',
      title: 'Fraud rate above industry benchmark',
      description: `Current rate ${Number(fraudRate).toFixed(2)}% exceeds benchmark of 0.42%`,
      time: 'Live',
      category: 'Fraud Analytics',
      source: 'kpi_analysis',
    });
  }

  categories?.slice(0, 3).forEach((cat, index) => {
    alerts.push({
      id: `ALT-C${String(index + 1).padStart(2, '0')}`,
      severity: index === 0 ? 'critical' : index === 1 ? 'high' : 'medium',
      title: `Elevated fraud activity in ${cat.category || cat.category_raw}`,
      description: `${cat.qtd_fraudes} frauds · $${Math.round(cat.volume_fraude).toLocaleString('en-US')} volume`,
      time: 'Filtered window',
      category: cat.category || cat.category_raw,
      source: 'category_analysis',
    });
  });

  const critical = filtered.filter((t) => t.risk_level === 'CRITICAL').length;
  if (critical > 0) {
    alerts.unshift({
      id: 'ALT-CRIT',
      severity: 'critical',
      title: `${critical} CRITICAL risk transactions in current filter`,
      description: 'Immediate review recommended for high-risk filtered subset',
      time: 'Live',
      category: 'Risk Scoring',
      source: 'filter_analysis',
    });
  }

  return alerts.slice(0, 30);
}

export function buildModels(kpis) {
  const data = kpis?.[0] ?? {};
  const fraudRate = data.taxa_fraude ?? 0;
  const accuracyBase = Math.max(88, 99.2 - fraudRate * 0.8);

  return [
    { name: 'fraud-detector-v3', status: fraudRate > 0.55 ? 'alerting' : 'healthy', accuracy: Number((accuracyBase + 0.3).toFixed(1)), latency: 42, alerts: fraudRate > 0.55 ? 2 : 0, lastTrain: '2026-06-03' },
    { name: 'risk-scorer-v2', status: 'healthy', accuracy: Number((accuracyBase - 1.2).toFixed(1)), latency: 28, alerts: 0, lastTrain: '2026-06-01' },
    { name: 'velocity-check-v1', status: fraudRate > 0.5 ? 'degraded' : 'healthy', accuracy: Number((accuracyBase - 3.5).toFixed(1)), latency: 15, alerts: fraudRate > 0.5 ? 1 : 0, lastTrain: '2026-05-28' },
    { name: 'anomaly-net-v4', status: 'healthy', accuracy: Number((accuracyBase - 0.8).toFixed(1)), latency: 67, alerts: 0, lastTrain: '2026-05-25' },
    { name: 'category-classifier', status: 'healthy', accuracy: Number((accuracyBase - 2.1).toFixed(1)), latency: 35, alerts: 0, lastTrain: '2026-05-20' },
    { name: 'behavioral-v2', status: fraudRate > 0.58 ? 'alerting' : 'healthy', accuracy: Number((accuracyBase - 4.2).toFixed(1)), latency: 52, alerts: fraudRate > 0.58 ? 1 : 0, lastTrain: '2026-05-15' },
  ];
}

export function getFilteredDataset(transactions, globalKpis, query) {
  const filters = parseFilters(query);
  const filtered = applyTransactionFilters(transactions, filters);
  const kpis = computeKpisFromTransactions(filtered, globalKpis);
  const categories = computeCategoriesFromTransactions(filtered);
  const hours = computeHoursFromTransactions(filtered);
  const alerts = buildDemoAlerts(filtered, kpis, hours, categories);

  return { filters, filtered, kpis, categories, hours, alerts };
}

export function getTransactionsPage(transactions, globalKpis, query) {
  const { filters, filtered } = getFilteredDataset(transactions, globalKpis, query);
  const sorted = sortTransactions(filtered, filters.sort, filters.order);
  const result = paginate(sorted, filters.page, filters.limit);

  return {
    ...result,
    filters: {
      categories: ['all', ...new Set(transactions.map((t) => t.category))],
      category_raw: ['all', ...new Set(transactions.map((t) => t.category_raw))],
      regions: ['all', ...new Set(transactions.map((t) => t.region).filter(Boolean))],
      statuses: ['all', 'blocked', 'review', 'flagged'],
      risk_levels: ['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      periods: ['all', '24h', '7d', '30d'],
    },
    meta: { applied: filters, static: true },
  };
}
