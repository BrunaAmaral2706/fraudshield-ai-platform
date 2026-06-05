/**
 * ML service — anomaly detection pipeline (Isolation Forest ready).
 * Current implementation: statistical z-score baseline for portfolio demo.
 */
const { getCache } = require('../database/dataStore');
const { applyTransactionFilters, parseFilters } = require('../lib/filters');

const MODEL_META = {
  name: 'isolation-forest-v1',
  version: '1.0.0-stub',
  status: 'ready',
  algorithm: 'IsolationForest',
  features: ['amount', 'hour', 'velocity', 'category_entropy'],
  pipeline: ['ingest', 'feature_engineering', 'train', 'infer', 'monitor'],
};

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values, avg) {
  if (values.length < 2) return 1;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance) || 1;
}

/**
 * Isolation Forest placeholder — uses multi-feature z-score until Python worker is wired.
 */
function detectAnomalies(transactions, limit = 25) {
  if (!transactions.length) return [];

  const amounts = transactions.map((t) => t.amount);
  const avgAmount = mean(amounts);
  const stdAmount = stdDev(amounts, avgAmount);

  const scored = transactions.map((tx) => {
    const amountZ = Math.abs((tx.amount - avgAmount) / stdAmount);
    const hourAnomaly = tx.hour >= 22 || tx.hour <= 3 ? 1.5 : 0;
    const velocityAnomaly = tx.risk_score >= 85 ? 1.2 : 0;
    const anomalyScore = Number((amountZ * 0.5 + hourAnomaly + velocityAnomaly).toFixed(3));
    const isAnomaly = anomalyScore >= 2.0 || tx.risk_level === 'CRITICAL';

    return {
      transaction_id: tx.transaction_id,
      anomaly_score: anomalyScore,
      is_anomaly: isAnomaly,
      risk_level: tx.risk_level,
      amount: tx.amount,
      category: tx.category,
      timestamp: tx.timestamp,
      factors: {
        amount_z: Number(amountZ.toFixed(2)),
        suspicious_hour: hourAnomaly > 0,
        high_risk: tx.risk_score >= 85,
      },
    };
  });

  return scored
    .filter((r) => r.is_anomaly)
    .sort((a, b) => b.anomaly_score - a.anomaly_score)
    .slice(0, limit);
}

function predictFraud(query = {}) {
  const cache = getCache();
  const filters = parseFilters(query);
  const filtered = applyTransactionFilters(cache.transactions ?? [], filters);
  const anomalies = detectAnomalies(filtered, parseInt(query.limit, 10) || 25);

  return {
    model: MODEL_META,
    summary: {
      total_scored: filtered.length,
      anomalies_detected: anomalies.length,
      anomaly_rate: filtered.length
        ? Number(((anomalies.length / filtered.length) * 100).toFixed(2))
        : 0,
    },
    predictions: anomalies,
    meta: { applied: filters },
  };
}

function getPipelineStatus() {
  return {
    ...MODEL_META,
    stages: MODEL_META.pipeline.map((stage, i) => ({
      stage,
      status: i < 4 ? 'operational' : 'monitoring',
      last_run: new Date().toISOString(),
    })),
    next_steps: [
      'Export features to Parquet for batch training',
      'Wire Python IsolationForest worker via child_process or REST',
      'Add model registry + drift monitoring',
    ],
  };
}

module.exports = {
  MODEL_META,
  detectAnomalies,
  predictFraud,
  getPipelineStatus,
};
