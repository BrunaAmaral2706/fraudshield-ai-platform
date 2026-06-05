/**
 * ML Service — delegates to fraud pipeline + intelligence layer.
 */
const { getCache } = require('../database/dataStore');
const { applyTransactionFilters, parseFilters } = require('../lib/filters');
const {
  getPipelineMetrics,
  getPipelineStatus,
} = require('../ml/pipelines/fraudPipeline');
const { predictTransaction } = require('../ml/inference/inferenceEngine');
const { getAnalysisReport } = require('./dataAnalysisService');
const { getRiskAnalysis } = require('./riskAnalysisService');
const { getFraudInsights } = require('./fraudIntelligenceService');

function logInference(action, detail) {
  console.log(`[ML:INFERENCE] ${action}`, typeof detail === 'object' ? JSON.stringify(detail) : detail);
}

function detectAnomalies(transactions, limit = 25) {
  return transactions
    .filter((t) => (t.anomaly_score ?? 0) >= 0.45 || t.ml_prediction !== 'LEGITIMATE')
    .sort((a, b) => (b.anomaly_score ?? 0) - (a.anomaly_score ?? 0))
    .slice(0, limit)
    .map((t) => ({
      transaction_id: t.transaction_id,
      anomaly_score: t.anomaly_score,
      fraud_probability: t.fraud_probability,
      ml_prediction: t.ml_prediction,
      severity: t.severity,
      ai_confidence: t.ai_confidence,
      risk_level: t.risk_level,
      amount: t.amount,
      category: t.category,
      timestamp: t.timestamp,
      explanation: t.risk_explanation?.summary,
      ai_explanation: t.ai_explanation ?? t.risk_explanation?.summary,
      factors: t.risk_explanation?.factors,
    }));
}

function predictFraud(query = {}) {
  const cache = getCache();
  const filters = parseFilters(query);
  const filtered = applyTransactionFilters(cache.transactions ?? [], filters);
  const limit = parseInt(query.limit, 10) || 25;
  const predictions = detectAnomalies(filtered, limit);

  logInference('batch_predict', {
    total: filtered.length,
    returned: predictions.length,
    filters,
  });

  const metrics = getPipelineMetrics();

  return {
    model: getPipelineStatus(),
    summary: {
      total_scored: filtered.length,
      anomalies_detected: predictions.length,
      anomaly_rate: filtered.length
        ? Number(((predictions.length / filtered.length) * 100).toFixed(2))
        : 0,
      avg_fraud_probability: metrics?.summary?.avg_fraud_probability,
    },
    predictions,
    meta: { applied: filters },
  };
}

function getMlPredictions(query) {
  return predictFraud(query);
}

function getAnomalies(query) {
  const result = predictFraud({ ...query, limit: query.limit || 50 });
  return {
    anomalies: result.predictions,
    summary: result.summary,
    meta: result.meta,
  };
}

function getDataAnalysis() {
  return getAnalysisReport();
}

module.exports = {
  predictFraud,
  getMlPredictions,
  getAnomalies,
  getPipelineStatus,
  getPipelineMetrics,
  getRiskAnalysis,
  getFraudInsights,
  getDataAnalysis,
  detectAnomalies,
};
