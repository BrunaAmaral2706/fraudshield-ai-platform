const { getCache, buildModels } = require('../database/dataStore');
const { setRecordCount } = require('../middleware/requestLogger');
const { getFilteredDataset } = require('../services/analyticsService');

function getKpis(req, res) {
  const { kpis } = getFilteredDataset(req.query);
  setRecordCount(res, kpis[0]?.total_fraudes ?? 0);
  res.json(kpis);
}

function getCategories(req, res) {
  const { categories } = getFilteredDataset(req.query);
  setRecordCount(res, categories.length);
  res.json(categories);
}

function getHours(req, res) {
  const { hours } = getFilteredDataset(req.query);
  setRecordCount(res, hours.length);
  res.json(hours);
}

function getAlerts(req, res) {
  const { alerts, filters } = getFilteredDataset(req.query);
  let rows = alerts;

  const severity = req.query.severity ?? 'all';
  if (severity !== 'all') {
    rows = rows.filter((a) => a.severity === severity);
  }

  setRecordCount(res, rows.length);
  res.json(rows);
}

function getModels(req, res) {
  const { kpis } = getFilteredDataset(req.query);
  const models = buildModels(kpis);
  setRecordCount(res, models.length);
  res.json(models);
}

function getSummary(req, res) {
  const cache = getCache();
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
    regions: [
      'all',
      ...new Set((cache.transactions ?? []).map((t) => t.region).filter(Boolean)),
    ],
    meta: { applied: dataset.filters },
  });
}

module.exports = {
  getKpis,
  getCategories,
  getHours,
  getAlerts,
  getModels,
  getSummary,
};
