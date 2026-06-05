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
  const filtered = dataset.filtered;
  setRecordCount(res, filtered.length);

  const { mean } = require('../ml/utils/stats');
  const avg = (arr) => (arr.length ? mean(arr) : 0);

  res.json({
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
