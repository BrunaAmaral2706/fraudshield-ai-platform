/**
 * Fraud Intelligence Service — AI insights and smart alerts.
 */
const { getCache } = require('../database/dataStore');
const { applyTransactionFilters, parseFilters } = require('../lib/filters');
const { mean } = require('../ml/utils/stats');
const { getAnalysisReport } = require('./dataAnalysisService');

const SEVERITY_MAP = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'WARNING',
  low: 'INFO',
};

function buildAiAlerts(transactions) {
  const alerts = [];
  if (!transactions.length) return alerts;

  const avgProb = mean(transactions.map((t) => t.fraud_probability ?? 0));
  const criticalCount = transactions.filter((t) => t.severity === 'CRITICAL').length;
  const anomalyCount = transactions.filter((t) => (t.anomaly_score ?? 0) >= 0.6).length;

  if (criticalCount > 0) {
    alerts.push({
      id: 'AI-CRIT-01',
      ai_severity: 'CRITICAL',
      severity: 'critical',
      title: `${criticalCount} CRITICAL AI fraud signals detected`,
      description: 'ML ensemble flagged transactions requiring immediate review',
      source: 'ml_ensemble',
      category: 'AI Risk Monitoring',
      time: 'Live',
    });
  }

  if (avgProb > 0.55) {
    alerts.push({
      id: 'AI-PROB-01',
      ai_severity: 'HIGH',
      severity: 'high',
      title: 'Elevated average fraud probability',
      description: `Mean fraud probability ${(avgProb * 100).toFixed(1)}% above baseline`,
      source: 'fraud_probability_monitor',
      category: 'Fraud Intelligence',
      time: 'Live',
    });
  }

  if (anomalyCount > transactions.length * 0.08) {
    alerts.push({
      id: 'AI-ANOM-01',
      ai_severity: 'WARNING',
      severity: 'medium',
      title: 'Unusual anomaly pattern detected',
      description: `${anomalyCount} transactions exceed Isolation Forest threshold`,
      source: 'anomaly_detection',
      category: 'Behavioral Analytics',
      time: 'Live',
    });
  }

  const byCat = new Map();
  transactions.forEach((tx) => {
    const cat = tx.category;
    byCat.set(cat, (byCat.get(cat) || 0) + 1);
  });
  const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] > transactions.length * 0.15) {
    alerts.push({
      id: 'AI-CAT-01',
      ai_severity: 'WARNING',
      severity: 'medium',
      title: `Anomalous concentration in ${topCat[0]}`,
      description: `${topCat[1]} high-risk transactions in single category`,
      source: 'category_intelligence',
      category: 'Fraud Intelligence',
      time: 'Filtered window',
    });
  }

  return alerts;
}

function getFraudInsights(query = {}) {
  const cache = getCache();
  const filters = parseFilters(query);
  const filtered = applyTransactionFilters(cache.transactions ?? [], filters);
  const report = getAnalysisReport();

  const mlDistribution = {
    FRAUD: filtered.filter((t) => t.ml_prediction === 'FRAUD').length,
    SUSPICIOUS: filtered.filter((t) => t.ml_prediction === 'SUSPICIOUS').length,
    LEGITIMATE: filtered.filter((t) => t.ml_prediction === 'LEGITIMATE').length,
  };

  return {
    insights: report.insights,
    correlations: report.correlations,
    ml_distribution: mlDistribution,
    anomaly_summary: {
      total: filtered.length,
      anomalies: filtered.filter((t) => (t.anomaly_score ?? 0) >= 0.55).length,
      avg_anomaly_score: Number(
        mean(filtered.map((t) => t.anomaly_score ?? 0)).toFixed(4),
      ),
      avg_confidence: Number(mean(filtered.map((t) => t.ai_confidence ?? 0)).toFixed(2)),
    },
    behavioral: {
      high_velocity_cards: new Set(
        filtered.filter((t) => (t.features?.user_velocity ?? 0) > 3).map((t) => t.cc_num),
      ).size,
      suspicious_hour_pct: report.temporal?.suspicious_hour_pct,
    },
    ai_alerts: buildAiAlerts(filtered),
    meta: { applied: filters },
    generated_at: new Date().toISOString(),
  };
}

function normalizeAlertSeverity(alert) {
  return {
    ...alert,
    ai_severity: alert.ai_severity ?? SEVERITY_MAP[alert.severity] ?? 'INFO',
  };
}

module.exports = {
  getFraudInsights,
  buildAiAlerts,
  normalizeAlertSeverity,
  SEVERITY_MAP,
};
