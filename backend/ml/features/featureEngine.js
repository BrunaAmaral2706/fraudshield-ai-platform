/**
 * Feature Engineering — enterprise ML features (reusable pipeline).
 */
const { mean, stdDev, zScore, clamp } = require('../utils/stats');
const { CRITICAL_CATEGORIES, parseHour } = require('../../lib/riskEngine');

const SUSPICIOUS_HOURS = new Set([0, 1, 2, 3, 22, 23]);

function buildCardProfiles(transactions) {
  const profiles = new Map();

  transactions.forEach((tx) => {
    const key = tx.cc_num || tx.transaction_id;
    if (!profiles.has(key)) {
      profiles.set(key, { amounts: [], count: 0, hours: [] });
    }
    const p = profiles.get(key);
    p.amounts.push(tx.amount);
    p.hours.push(tx.hour ?? parseHour(tx.timestamp));
    p.count += 1;
  });

  profiles.forEach((p) => {
    p.avg_amount = mean(p.amounts);
    p.std_amount = stdDev(p.amounts, p.avg_amount);
    p.frequency = p.count;
  });

  return profiles;
}

function buildGlobalStats(transactions) {
  const amounts = transactions.map((t) => t.amount);
  const avgAmount = mean(amounts);
  const stdAmount = stdDev(amounts, avgAmount);

  const categoryCounts = new Map();
  transactions.forEach((tx) => {
    const cat = tx.category_raw || tx.category;
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  const total = transactions.length || 1;
  const categoryRisk = {};
  categoryCounts.forEach((count, cat) => {
    const rate = count / total;
    categoryRisk[cat] = clamp(rate * 3 + (CRITICAL_CATEGORIES.has(cat) ? 0.4 : 0), 0, 1);
  });

  return {
    avgAmount,
    stdAmount,
    totalTransactions: transactions.length,
    categoryRisk,
    cardProfiles: buildCardProfiles(transactions),
  };
}

function extractFeatures(transaction, globalStats) {
  const key = transaction.cc_num || transaction.transaction_id;
  const profile = globalStats.cardProfiles.get(key) || {
    avg_amount: globalStats.avgAmount,
    std_amount: globalStats.stdAmount,
    frequency: 1,
    count: 1,
  };

  const hour = transaction.hour ?? parseHour(transaction.timestamp);
  const categoryRaw = transaction.category_raw || transaction.category || '';
  const amount = transaction.amount ?? 0;

  const amount_zscore = zScore(amount, globalStats.avgAmount, globalStats.stdAmount);
  const amount_deviation = zScore(amount, profile.avg_amount, profile.std_amount);
  const velocity_fraud = profile.count;
  const customer_frequency = profile.frequency;
  const avg_customer_amount = profile.avg_amount;
  const high_risk_category = CRITICAL_CATEGORIES.has(String(categoryRaw).toLowerCase()) ? 1 : 0;
  const suspicious_hour = SUSPICIOUS_HOURS.has(hour) ? 1 : 0;

  const anomaly_behavior = clamp(
    Math.abs(amount_zscore) * 0.12 +
      suspicious_hour * 0.35 +
      (velocity_fraud > 3 ? 0.25 : velocity_fraud > 1 ? 0.1 : 0) +
      Math.abs(amount_deviation) * 0.1,
    0,
    1,
  );

  const customer_risk = clamp(
    (velocity_fraud > 3 ? 0.35 : velocity_fraud > 1 ? 0.15 : 0) +
      (globalStats.categoryRisk[categoryRaw] ?? 0.1) +
      (Math.abs(amount_deviation) > 2 ? 0.25 : 0) +
      anomaly_behavior * 0.15,
    0,
    1,
  );

  return {
    transaction_hour: hour,
    suspicious_hour,
    amount_zscore: Number(amount_zscore.toFixed(4)),
    velocity_fraud,
    customer_frequency,
    avg_customer_amount: Number(avg_customer_amount.toFixed(2)),
    amount_deviation: Number(amount_deviation.toFixed(4)),
    high_risk_category,
    anomaly_behavior: Number(anomaly_behavior.toFixed(4)),
    // backward-compatible aliases
    user_velocity: velocity_fraud,
    transaction_frequency: customer_frequency,
    customer_risk: Number(customer_risk.toFixed(4)),
  };
}

function enrichTransaction(transaction, globalStats) {
  const features = extractFeatures(transaction, globalStats);
  return { ...transaction, features };
}

module.exports = {
  buildGlobalStats,
  buildCardProfiles,
  extractFeatures,
  enrichTransaction,
  SUSPICIOUS_HOURS,
  FEATURE_NAMES: [
    'transaction_hour',
    'suspicious_hour',
    'amount_zscore',
    'velocity_fraud',
    'customer_frequency',
    'avg_customer_amount',
    'amount_deviation',
    'high_risk_category',
    'anomaly_behavior',
  ],
};
