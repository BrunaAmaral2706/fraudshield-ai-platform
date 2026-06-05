/**
 * Data Analysis Service — statistical fraud intelligence report.
 */
const { getCache } = require('../database/dataStore');
const { mean, stdDev, percentile } = require('../ml/utils/stats');
const { CRITICAL_CATEGORIES } = require('../lib/riskEngine');
const { SUSPICIOUS_HOURS } = require('../ml/features/featureEngine');

function analyzeDataset(transactions) {
  if (!transactions?.length) {
    return { error: 'No transactions available', generated_at: new Date().toISOString() };
  }

  const start = Date.now();
  const amounts = transactions.map((t) => t.amount);
  const avgAmount = mean(amounts);
  const totalVolume = amounts.reduce((s, v) => s + v, 0);

  const byCategory = new Map();
  const byHour = Array.from({ length: 24 }, () => ({ count: 0, volume: 0 }));
  const byRegion = new Map();
  const byRisk = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

  transactions.forEach((tx) => {
    const cat = tx.category_raw || tx.category;
    const prev = byCategory.get(cat) || { count: 0, volume: 0, category: tx.category };
    byCategory.set(cat, {
      ...prev,
      count: prev.count + 1,
      volume: prev.volume + tx.amount,
    });

    const h = tx.hour ?? 0;
    if (h >= 0 && h < 24) {
      byHour[h].count += 1;
      byHour[h].volume += tx.amount;
    }

    byRegion.set(tx.region, (byRegion.get(tx.region) || 0) + 1);
    byRisk[tx.risk_level] = (byRisk[tx.risk_level] || 0) + 1;
  });

  const categories = Array.from(byCategory.entries())
    .map(([raw, data]) => ({ category_raw: raw, ...data }))
    .sort((a, b) => b.count - a.count);

  const criticalCategories = categories.filter((c) =>
    CRITICAL_CATEGORIES.has(String(c.category_raw).toLowerCase()),
  );

  const peakHour = byHour.reduce(
    (best, row, hour) => (row.count > best.count ? { hour, ...row } : best),
    { hour: 0, count: 0, volume: 0 },
  );

  const suspiciousHourCount = transactions.filter((t) =>
    SUSPICIOUS_HOURS.has(t.hour ?? 0),
  ).length;

  const highAnomaly = transactions.filter((t) => (t.anomaly_score ?? 0) >= 0.55).length;

  const report = {
    generated_at: new Date().toISOString(),
    compute_ms: Date.now() - start,
    overview: {
      total_fraud_transactions: transactions.length,
      total_volume: Number(totalVolume.toFixed(2)),
      avg_amount: Number(avgAmount.toFixed(2)),
      median_amount: Number(percentile(amounts, 50).toFixed(2)),
      std_amount: Number(stdDev(amounts, avgAmount).toFixed(2)),
      fraud_rate_dataset: 100,
    },
    distribution: {
      risk_levels: byRisk,
      regions: Object.fromEntries(byRegion),
      top_categories: categories.slice(0, 5),
    },
    temporal: {
      peak_hour: peakHour.hour,
      peak_hour_count: peakHour.count,
      peak_hour_volume: Number(peakHour.volume.toFixed(2)),
      suspicious_hour_pct: Number(((suspiciousHourCount / transactions.length) * 100).toFixed(2)),
      hourly: byHour.map((row, hour) => ({
        hour,
        count: row.count,
        volume: Number(row.volume.toFixed(2)),
      })),
    },
    insights: [
      {
        type: 'category',
        severity: 'HIGH',
        message: `Top fraud category: ${categories[0]?.category ?? 'unknown'} (${categories[0]?.count ?? 0} cases)`,
      },
      {
        type: 'temporal',
        severity: 'WARNING',
        message: `Peak fraud hour: ${String(peakHour.hour).padStart(2, '0')}:00 with ${peakHour.count} cases`,
      },
      {
        type: 'volume',
        severity: 'INFO',
        message: `Total fraud volume: $${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      },
      {
        type: 'critical_categories',
        severity: 'CRITICAL',
        message: `${criticalCategories.length} critical categories account for ${criticalCategories.reduce((s, c) => s + c.count, 0)} frauds`,
      },
      {
        type: 'anomaly',
        severity: highAnomaly > transactions.length * 0.1 ? 'HIGH' : 'INFO',
        message: `${highAnomaly} transactions flagged as behavioral anomalies (${((highAnomaly / transactions.length) * 100).toFixed(1)}%)`,
      },
    ],
    correlations: {
      amount_risk: Number(
        mean(
          transactions.map((t) => (t.amount / avgAmount) * ((t.risk_score ?? 0) / 100)),
        ).toFixed(4),
      ),
      hour_risk: Number(
        (suspiciousHourCount / transactions.length) *
          (byRisk.HIGH + byRisk.CRITICAL) /
          transactions.length,
      ).toFixed(4),
      category_concentration: Number(
        (categories[0]?.count ?? 0) / transactions.length,
      ).toFixed(4),
    },
    variables: [
      'amount',
      'transaction_hour',
      'category_raw',
      'user_velocity',
      'amount_zscore',
      'region',
      'risk_score',
      'fraud_probability',
    ],
  };

  console.log(`[ANALYSIS] Report generated in ${report.compute_ms}ms — ${transactions.length} records`);
  return report;
}

function getAnalysisReport() {
  const cache = getCache();
  if (cache.analyticsReport) return cache.analyticsReport;
  cache.analyticsReport = analyzeDataset(cache.transactions ?? []);
  return cache.analyticsReport;
}

module.exports = { analyzeDataset, getAnalysisReport };
