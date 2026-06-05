/**
 * Filter utilities — parse query params and apply to transaction datasets.
 */

const PERIOD_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

function parseFilters(query = {}) {
  return {
    search: String(query.search ?? '').toLowerCase().trim(),
    status: query.status ?? 'all',
    category: query.category ?? 'all',
    risk_level: query.risk_level ?? query.riskLevel ?? 'all',
    period: query.period ?? 'all',
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

function applyTransactionFilters(transactions, filters) {
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
    rows = rows.filter(
      (tx) => tx.risk_level === filters.risk_level.toUpperCase(),
    );
  }

  return rows;
}

function sortTransactions(rows, sort, order) {
  const dir = order === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort === 'amount') return (a.amount - b.amount) * dir;
    if (sort === 'risk_score') return (a.risk_score - b.risk_score) * dir;
    if (sort === 'category') return a.category.localeCompare(b.category) * dir;
    if (sort === 'risk_level') return a.risk_level.localeCompare(b.risk_level) * dir;
    return (new Date(a.timestamp) - new Date(b.timestamp)) * dir;
  });
}

function paginate(rows, page, limit) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    pagination: { page: safePage, limit, total, totalPages },
  };
}

function computeKpisFromTransactions(transactions, globalKpis) {
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

function computeCategoriesFromTransactions(transactions) {
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

function computeHoursFromTransactions(transactions) {
  const hours = Array.from({ length: 24 }, () => ({ qtd_fraudes: 0 }));
  transactions.forEach((tx) => {
    const h = tx.hour ?? 0;
    if (h >= 0 && h < 24) hours[h].qtd_fraudes += 1;
  });
  return hours;
}

module.exports = {
  parseFilters,
  applyTransactionFilters,
  sortTransactions,
  paginate,
  computeKpisFromTransactions,
  computeCategoriesFromTransactions,
  computeHoursFromTransactions,
  filterByPeriod,
};
