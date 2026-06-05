/**
 * FraudShield Risk Engine
 * Multi-factor risk scoring for fraud transactions.
 */

const CRITICAL_CATEGORIES = new Set([
  'shopping_net',
  'grocery_pos',
  'misc_net',
  'shopping_pos',
]);

const SUSPICIOUS_HOURS = new Set([0, 1, 2, 3, 22, 23]);

function parseHour(timestamp) {
  if (!timestamp) return 12;
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) {
    const match = String(timestamp).match(/(\d{2}):\d{2}/);
    return match ? parseInt(match[1], 10) : 12;
  }
  return d.getHours();
}

function scoreAmount(amount) {
  const amt = Number(amount) || 0;
  if (amt >= 10000) return 35;
  if (amt >= 5000) return 28;
  if (amt >= 1000) return 20;
  if (amt >= 500) return 12;
  if (amt >= 100) return 6;
  return 2;
}

function scoreHour(hour) {
  if (SUSPICIOUS_HOURS.has(hour)) return 22;
  if (hour >= 4 && hour <= 6) return 10;
  return 0;
}

function scoreCategory(categoryRaw) {
  const cat = String(categoryRaw || '').toLowerCase();
  if (CRITICAL_CATEGORIES.has(cat)) return 18;
  if (cat.includes('net') || cat.includes('shopping')) return 12;
  return 4;
}

function getRiskLevel(score) {
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 45) return 'MEDIUM';
  return 'LOW';
}

function getAlertLevel(riskLevel) {
  const map = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  };
  return map[riskLevel] ?? 'low';
}

function computeStatus(amount, riskScore, riskLevel) {
  if (riskLevel === 'CRITICAL' || riskScore >= 90 || Number(amount) >= 5000) {
    return 'blocked';
  }
  if (riskLevel === 'HIGH' || riskScore >= 75 || Number(amount) >= 1000) {
    return 'review';
  }
  return 'flagged';
}

function computeEnterpriseRisk(transaction, velocityFraud = 1, features = null) {
  const amount = Number(transaction.amount ?? transaction.amt ?? 0);
  const categoryRaw = String(transaction.category_raw ?? transaction.category ?? '').toLowerCase();
  const hour = transaction.hour ?? parseHour(transaction.timestamp);

  let score = 0;

  if (amount > 1000) score += 30;
  else if (amount > 500) score += 12;

  if (hour === 22 || hour === 23 || SUSPICIOUS_HOURS.has(hour)) score += 20;

  if (categoryRaw === 'shopping_net') score += 25;
  else if (CRITICAL_CATEGORIES.has(categoryRaw)) score += 18;

  if (velocityFraud > 5) score += 40;
  else if (velocityFraud > 2) score += 15;

  const amountZ = features?.amount_zscore ?? 0;
  if (Math.abs(amountZ) > 2) score += 10;

  const anomalyBehavior = features?.anomaly_behavior ?? 0;
  if (anomalyBehavior > 0.5) score += 12;

  score = Math.min(99, score + 10);

  const risk_level = getRiskLevel(score);
  const fraud_probability = Math.min(
    0.99,
    Number((score / 100 + (velocityFraud > 5 ? 0.1 : 0)).toFixed(4)),
  );
  const severity =
    fraud_probability >= 0.85 || risk_level === 'CRITICAL'
      ? 'CRITICAL'
      : fraud_probability >= 0.65 || risk_level === 'HIGH'
        ? 'HIGH'
        : fraud_probability >= 0.4 || risk_level === 'MEDIUM'
          ? 'WARNING'
          : 'INFO';
  const alert_level = getAlertLevel(risk_level);
  const status = computeStatus(amount, score, risk_level);

  return {
    risk_score: score,
    risk_level,
    fraud_probability,
    severity,
    alert_level,
    status,
    hour,
  };
}

function computeRisk(transaction) {
  const amount = transaction.amount ?? transaction.amt ?? 0;
  const categoryRaw = transaction.category_raw ?? transaction.category ?? '';
  const hour = transaction.hour ?? parseHour(transaction.timestamp);

  const amountScore = scoreAmount(amount);
  const hourScore = scoreHour(hour);
  const categoryScore = scoreCategory(categoryRaw);

  const risk_score = Math.min(99, amountScore + hourScore + categoryScore + 10);
  const risk_level = getRiskLevel(risk_score);
  const alert_level = getAlertLevel(risk_level);
  const status = computeStatus(amount, risk_score, risk_level);

  return { risk_score, risk_level, alert_level, status, hour };
}

function explainRisk(transaction, features = null) {
  const amount = transaction.amount ?? 0;
  const categoryRaw = transaction.category_raw ?? transaction.category ?? '';
  const hour = transaction.hour ?? parseHour(transaction.timestamp);
  const factors = [];

  if (amount >= 1000) {
    factors.push({
      factor: 'high_amount',
      label: 'High transaction amount',
      impact: amount >= 5000 ? 'critical' : 'high',
      detail: `$${Number(amount).toLocaleString('en-US')} exceeds typical threshold`,
    });
  }

  if (SUSPICIOUS_HOURS.has(hour)) {
    factors.push({
      factor: 'suspicious_hour',
      label: 'Suspicious hour',
      impact: 'high',
      detail: `Transaction at ${String(hour).padStart(2, '0')}:00 (22h–03h window)`,
    });
  }

  const cat = String(categoryRaw).toLowerCase();
  if (CRITICAL_CATEGORIES.has(cat)) {
    factors.push({
      factor: 'risky_category',
      label: 'High-risk category',
      impact: 'high',
      detail: `${formatCategoryLabel(categoryRaw)} is a critical fraud category`,
    });
  }

  if (features?.velocity_fraud > 2 || features?.user_velocity > 2) {
    const vel = features.velocity_fraud ?? features.user_velocity;
    factors.push({
      factor: 'velocity_fraud',
      label: 'Elevated card velocity',
      impact: vel > 5 ? 'critical' : 'medium',
      detail: `${vel} transactions on same card in dataset window`,
    });
  }

  if (features?.anomaly_behavior > 0.5) {
    factors.push({
      factor: 'anomaly_detected',
      label: 'Anomaly detected',
      impact: 'high',
      detail: `Behavioral anomaly score ${(features.anomaly_behavior * 100).toFixed(0)}%`,
    });
  }

  if (features && Math.abs(features.amount_deviation) > 2) {
    factors.push({
      factor: 'anomalous_behavior',
      label: 'Anomalous spending pattern',
      impact: 'high',
      detail: `Amount deviates ${Math.abs(features.amount_deviation).toFixed(1)}σ from customer average`,
    });
  }

  if (features?.customer_risk > 0.5) {
    factors.push({
      factor: 'customer_risk',
      label: 'Elevated customer risk profile',
      impact: 'medium',
      detail: `Behavioral risk score ${(features.customer_risk * 100).toFixed(0)}%`,
    });
  }

  const summary =
    factors.length > 0
      ? `Risk increased because: ${factors.map((f) => f.label.toLowerCase()).join(', ')}`
      : 'Standard risk profile — no critical factors detected';

  return { summary, factors, factor_count: factors.length };
}

function formatCategoryLabel(category) {
  return String(category || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = {
  computeRisk,
  computeEnterpriseRisk,
  explainRisk,
  getRiskLevel,
  getAlertLevel,
  computeStatus,
  formatCategoryLabel,
  parseHour,
  CRITICAL_CATEGORIES,
};
