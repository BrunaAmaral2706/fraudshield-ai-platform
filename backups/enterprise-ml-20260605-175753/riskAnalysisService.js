/**
 * Risk Analysis Service — aggregated risk intelligence.
 */
const { getCache } = require('../database/dataStore');
const { applyTransactionFilters, parseFilters } = require('../lib/filters');
const { mean } = require('../ml/utils/stats');

function getRiskAnalysis(query = {}) {
  const cache = getCache();
  const filters = parseFilters(query);
  const filtered = applyTransactionFilters(cache.transactions ?? [], filters);

  const riskDistribution = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => ({
    level,
    count: filtered.filter((t) => t.risk_level === level).length,
    pct: filtered.length
      ? Number(((filtered.filter((t) => t.risk_level === level).length / filtered.length) * 100).toFixed(2))
      : 0,
  }));

  const severityDistribution = ['INFO', 'WARNING', 'HIGH', 'CRITICAL'].map((sev) => ({
    severity: sev,
    count: filtered.filter((t) => t.severity === sev).length,
  }));

  const topRisk = [...filtered]
    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
    .slice(0, 10)
    .map((t) => ({
      transaction_id: t.transaction_id,
      risk_score: t.risk_score,
      risk_level: t.risk_level,
      fraud_probability: t.fraud_probability,
      amount: t.amount,
      category: t.category,
      explanation: t.risk_explanation?.summary,
    }));

  return {
    summary: {
      total_analyzed: filtered.length,
      avg_risk_score: Number(mean(filtered.map((t) => t.risk_score ?? 0)).toFixed(2)),
      avg_fraud_probability: Number(
        mean(filtered.map((t) => t.fraud_probability ?? 0)).toFixed(4),
      ),
      critical_count: filtered.filter((t) => t.risk_level === 'CRITICAL').length,
      blocked_count: filtered.filter((t) => t.status === 'blocked').length,
    },
    risk_distribution: riskDistribution,
    severity_distribution: severityDistribution,
    top_risk_transactions: topRisk,
    meta: { applied: filters },
    generated_at: new Date().toISOString(),
  };
}

module.exports = { getRiskAnalysis };
