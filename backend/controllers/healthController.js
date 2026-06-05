const { getCache } = require('../database/dataStore');
const { setRecordCount } = require('../middleware/requestLogger');

function getRoot(req, res) {
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
      '/ml/predict',
      '/ml/pipeline',
      '/ml/metrics',
      '/ml-predictions',
      '/anomalies',
      '/risk-analysis',
      '/fraud-insights',
      '/data-analysis',
    ],
  });
}

function getHealth(req, res) {
  const cache = getCache();
  setRecordCount(res, cache.stats?.transactions ?? 0);
  res.json({
    status: cache.ready ? 'ok' : 'loading',
    ready: cache.ready,
    stats: cache.stats,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getRoot, getHealth };
