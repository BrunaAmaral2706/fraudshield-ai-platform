/**
 * Export static demo bundle for GitHub Pages — run from repo root:
 *   node backend/scripts/export-demo-static.js
 */
const fs = require('fs');
const path = require('path');
const { initializeData, getCache, buildModels } = require('../lib/dataStore');
const { getFilteredDataset, getTransactionsPage } = require('../services/analyticsService');
const {
  getPipelineStatus,
  getPipelineMetrics,
} = require('../ml/pipelines/fraudPipeline');
const {
  getRiskAnalysis,
} = require('../services/riskAnalysisService');
const {
  getFraudInsights,
} = require('../services/fraudIntelligenceService');
const { mean } = require('../ml/utils/stats');

function buildSummaryExport(cache, dataset) {
  const filtered = dataset.filtered;
  const avg = (arr) => (arr.length ? mean(arr) : 0);

  return {
    kpis: dataset.kpis[0],
    totals: {
      transactions: filtered.length,
      categories: dataset.categories.length,
      alerts: dataset.alerts.length,
    },
    risk_distribution: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => ({
      level,
      count: filtered.filter((t) => t.risk_level === level).length,
    })),
    ml_summary: {
      avg_risk_score: Number(avg(filtered.map((t) => t.risk_score ?? 0)).toFixed(2)),
      avg_fraud_probability: Number(avg(filtered.map((t) => t.fraud_probability ?? 0)).toFixed(4)),
      avg_ai_confidence: Number(avg(filtered.map((t) => t.ai_confidence ?? 0)).toFixed(2)),
      high_risk_count: filtered.filter((t) => t.risk_level === 'HIGH' || t.risk_level === 'CRITICAL').length,
      anomalies_detected: filtered.filter((t) => (t.anomaly_score ?? 0) >= 0.55).length,
    },
    regions: [
      'all',
      ...new Set((cache.transactions ?? []).map((t) => t.region).filter(Boolean)),
    ],
    meta: { applied: dataset.filters, exported: true },
  };
}

async function main() {
  console.log('[EXPORT] Initializing data store...');
  await initializeData();
  const cache = getCache();

  if (!cache.ready) {
    throw new Error('Data store failed to initialize');
  }

  const dataset = getFilteredDataset({});
  const { getAnomalies, getMlPredictions, getDataAnalysis } = require('../services/mlService');

  const bundle = {
    health: {
      status: 'ok',
      ready: true,
      stats: cache.stats,
      timestamp: new Date().toISOString(),
    },
    globalKpis: cache.kpis,
    transactions: cache.transactions,
    kpis: dataset.kpis,
    categories: dataset.categories,
    hours: dataset.hours,
    alerts: dataset.alerts,
    models: buildModels(dataset.kpis),
    summary: buildSummaryExport(cache, dataset),
    transactionsPage: getTransactionsPage({ limit: 20 }),
    mlPipeline: getPipelineStatus(),
    mlMetrics: getPipelineMetrics(),
    riskAnalysis: getRiskAnalysis({}),
    fraudInsights: getFraudInsights({}),
    anomalies: getAnomalies({ limit: 50 }),
    mlPredictions: getMlPredictions({ limit: 25 }),
    dataAnalysis: getDataAnalysis(),
  };

  const outDir = path.join(__dirname, '../../frontend/public/demo');
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'bundle.json');
  fs.writeFileSync(outPath, JSON.stringify(bundle));
  const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
  console.log(`[EXPORT] Wrote ${outPath} (${sizeMb} MB, ${cache.transactions.length} transactions)`);
}

main().catch((err) => {
  console.error('[EXPORT] Failed:', err);
  process.exit(1);
});
