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

function formatCategoryLabel(category) {
  return String(category || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = {
  computeRisk,
  getRiskLevel,
  getAlertLevel,
  computeStatus,
  formatCategoryLabel,
  parseHour,
  CRITICAL_CATEGORIES,
};
