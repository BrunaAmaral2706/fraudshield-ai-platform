/**
 * API routes — all FraudShield endpoints with filter support.
 */

const express = require('express');
const { setRecordCount } = require('../lib/logger');
const { getCache, rebuildAlerts } = require('../lib/dataStore');
const {
  parseFilters,
  applyTransactionFilters,
  sortTransactions,
  paginate,
  computeKpisFromTransactions,
  computeCategoriesFromTransactions,
  computeHoursFromTransactions,
} = require('../lib/filters');

const router = express.Router();

function ensureReady(req, res, next) {
  const cache = getCache();
  if (cache.ready) return next();

  const { initializeData } = require('../lib/dataStore');
  initializeData()
    .then(() => next())
    .catch((err) => {
      console.error('[ERROR] Data init failed:', err.message);
      res.status(500).json({ error: 'Failed to initialize data store' });
    });
}

function getFilteredDataset(query) {
  const cache = getCache();
  const filters = parseFilters(query);
  const filtered = applyTransactionFilters(cache.transactions ?? [], filters);

  return {
    filters,
    filtered,
    kpis: computeKpisFromTransactions(filtered, cache.kpis),
    categories: computeCategoriesFromTransactions(filtered),
    hours: computeHoursFromTransactions(filtered),
    alerts: rebuildAlerts(filtered, computeKpisFromTransactions(filtered, cache.kpis), computeHoursFromTransactions(filtered), computeCategoriesFromTransactions(filtered)),
  };
}

function handleTransactions(req, res) {
  const cache = getCache();
  const { filters, filtered } = getFilteredDataset(req.query);
  const sorted = sortTransactions(filtered, filters.sort, filters.order);
  const result = paginate(sorted, filters.page, filters.limit);

  setRecordCount(res, result.pagination.total);

  res.json({
    ...result,
    filters: {
      categories: ['all', ...new Set((cache.transactions ?? []).map((t) => t.category))],
      category_raw: ['all', ...new Set((cache.transactions ?? []).map((t) => t.category_raw))],
      statuses: ['all', 'blocked', 'review', 'flagged'],
      risk_levels: ['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      periods: ['all', '24h', '7d', '30d'],
    },
    meta: { applied: filters },
  });
}

router.get('/', (req, res) => {
  const cache = getCache();
  res.json({
    status: 'success',
    message: 'FraudShield Analytics API Running',
    ready: cache.ready,
    stats: cache.stats,
    endpoints: [
      '/health',
      '/kpis',
      '/fraudes/categorias',
      '/fraudes/horarios',
      '/transactions',
      '/transacoes',
      '/alertas',
      '/modelos',
      '/analytics/summary',
    ],
  });
});

router.get('/health', (req, res) => {
  const cache = getCache();
  setRecordCount(res, cache.stats?.transactions ?? 0);
  res.json({
    status: cache.ready ? 'ok' : 'loading',
    ready: cache.ready,
    stats: cache.stats,
    timestamp: new Date().toISOString(),
  });
});

router.get('/kpis', ensureReady, (req, res) => {
  const { kpis, filtered } = getFilteredDataset(req.query);
  setRecordCount(res, kpis[0]?.total_fraudes ?? 0);
  res.json(kpis);
});

router.get('/fraudes/categorias', ensureReady, (req, res) => {
  const { categories } = getFilteredDataset(req.query);
  setRecordCount(res, categories.length);
  res.json(categories);
});

router.get('/fraudes/horarios', ensureReady, (req, res) => {
  const { hours } = getFilteredDataset(req.query);
  setRecordCount(res, hours.length);
  res.json(hours);
});

router.get('/transactions', ensureReady, handleTransactions);
router.get('/transacoes', ensureReady, handleTransactions);

router.get('/alertas', ensureReady, (req, res) => {
  const { alerts, filters } = getFilteredDataset(req.query);
  let rows = alerts;

  const severity = req.query.severity ?? 'all';
  if (severity !== 'all') {
    rows = rows.filter((a) => a.severity === severity);
  }

  setRecordCount(res, rows.length);
  res.json(rows);
});

router.get('/modelos', ensureReady, (req, res) => {
  const cache = getCache();
  const { kpis } = getFilteredDataset(req.query);
  const { buildModels } = require('../lib/dataStore');
  const models = buildModels(kpis);
  setRecordCount(res, models.length);
  res.json(models);
});

router.get('/analytics/summary', ensureReady, (req, res) => {
  const dataset = getFilteredDataset(req.query);
  setRecordCount(res, dataset.filtered.length);
  res.json({
    kpis: dataset.kpis[0],
    totals: {
      transactions: dataset.filtered.length,
      categories: dataset.categories.length,
      alerts: dataset.alerts.length,
    },
    risk_distribution: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => ({
      level,
      count: dataset.filtered.filter((t) => t.risk_level === level).length,
    })),
    meta: { applied: dataset.filters },
  });
});

module.exports = router;
