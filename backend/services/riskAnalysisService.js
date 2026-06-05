/**
 * Risk Analysis Service — aggregated risk intelligence + chart series.
 */
const { getCache } = require('../database/dataStore');
const { applyTransactionFilters, parseFilters } = require('../lib/filters');
const { mean } = require('../ml/utils/stats');
const { getPipelineMetrics } = require('../ml/pipelines/fraudPipeline');

function buildHourlySeries(transactions, field) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, '0')}:00`,
    value: 0,
    count: 0,
  }));

  transactions.forEach((tx) => {
    const h = tx.hour ?? tx.features?.transaction_hour ?? 0;
    if (h >= 0 && h < 24) {
      buckets[h].value += tx[field] ?? 0;
      buckets[h].count += 1;
    }
  });

  return buckets.map((b) => ({
    hour: b.hour,
    value: b.count ? Number((b.value / b.count).toFixed(4)) : 0,
    avg:
      field === 'fraud_probability' || field === 'anomaly_score'
        ? Number((b.count ? b.value / b.count : 0).toFixed(4))
        : b.value,
  }));
}

function buildHeatmap(transactions) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const grid = [];

  days.forEach((day, dayIdx) => {
    for (let hour = 0; hour < 24; hour += 4) {
      const subset = transactions.filter((tx) => {
        const h = tx.hour ?? 0;
        return h >= hour && h < hour + 4 && (tx.transaction_id.charCodeAt(0) + dayIdx) % 7 === dayIdx;
      });
      const avgRisk = subset.length
        ? mean(subset.map((t) => t.risk_score ?? 0))
        : 0;
      grid.push({
        day,
        hour: `${String(hour).padStart(2, '0')}h`,
        value: Math.round(avgRisk),
      });
    }
  });

  return grid;
}

function getRiskAnalysis(query = {}) {
  const cache = getCache();
  const filters = parseFilters(query);
  const filtered = applyTransactionFilters(cache.transactions ?? [], filters);
  const metrics = getPipelineMetrics();

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
    .slice(0, 12)
    .map((t) => ({
      transaction_id: t.transaction_id,
      risk_score: t.risk_score,
      risk_level: t.risk_level,
      fraud_probability: t.fraud_probability,
      anomaly_score: t.anomaly_score,
      ai_confidence: t.ai_confidence,
      amount: t.amount,
      category: t.category,
      explanation: t.ai_explanation ?? t.risk_explanation?.summary,
    }));

  const highRiskCount = filtered.filter(
    (t) => t.risk_level === 'HIGH' || t.risk_level === 'CRITICAL',
  ).length;

  return {
    summary: {
      total_analyzed: filtered.length,
      avg_risk_score: Number(mean(filtered.map((t) => t.risk_score ?? 0)).toFixed(2)),
      avg_fraud_probability: Number(
        mean(filtered.map((t) => t.fraud_probability ?? 0)).toFixed(4),
      ),
      avg_ai_confidence: Number(
        mean(filtered.map((t) => t.ai_confidence ?? 0)).toFixed(2),
      ),
      critical_count: filtered.filter((t) => t.risk_level === 'CRITICAL').length,
      high_risk_count: highRiskCount,
      blocked_count: filtered.filter((t) => t.status === 'blocked').length,
      ai_accuracy: metrics?.metrics?.accuracy ?? null,
    },
    risk_distribution: riskDistribution,
    severity_distribution: severityDistribution,
    top_risk_transactions: topRisk,
    charts: {
      probability_trend: buildHourlySeries(filtered, 'fraud_probability'),
      confidence_trend: buildHourlySeries(filtered, 'ai_confidence'),
      anomaly_timeline: topRisk.map((t, i) => ({
        index: i + 1,
        anomaly: Number(((t.anomaly_score ?? 0) * 100).toFixed(1)),
        label: t.transaction_id?.slice(0, 8),
      })),
      risk_heatmap: buildHeatmap(filtered),
    },
    meta: { applied: filters },
    generated_at: new Date().toISOString(),
  };
}

module.exports = { getRiskAnalysis };
