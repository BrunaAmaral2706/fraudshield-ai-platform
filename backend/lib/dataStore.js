/**
 * Data store — loads gold JSON + CSV fraud transactions into memory cache.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { formatCategoryLabel, computeEnterpriseRisk } = require('./riskEngine');
const {
  computeCategoriesFromTransactions,
  computeHoursFromTransactions,
} = require('./filters');
const { getRegionFromState } = require('../utils/regions');

const DATA_DIR = path.join(__dirname, '../../data');
const GOLD_DIR = path.join(DATA_DIR, 'gold');
const CSV_PATH = path.join(DATA_DIR, 'raw/credit_card_transactions.csv');

const cache = {
  ready: false,
  loading: null,
  kpis: null,
  hours: null,
  categories: null,
  transactions: null,
  alerts: null,
  models: null,
  stats: {},
};

function readJson(fileName) {
  const filePath = path.join(GOLD_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Gold file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadGoldData() {
  cache.kpis = readJson('fraud_kpis.json');
  cache.hours = readJson('fraud_by_hour.json');
  cache.categories = readJson('fraud_by_category.json');
  console.log('[DATA] Gold layer loaded:', {
    kpis: cache.kpis?.length ?? 0,
    hours: cache.hours?.length ?? 0,
    categories: cache.categories?.length ?? 0,
  });
}

async function loadFraudTransactionsFromCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    console.warn('[DATA] CSV not found:', CSV_PATH);
    return { frauds: [], categories: [] };
  }

  const start = Date.now();

  return new Promise((resolve, reject) => {
    const frauds = [];
    const merchantCounts = new Map();

    fs.createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true }))
      .on('data', (row) => {
        if (row.is_fraud !== '1' && row.is_fraud !== 1) return;

        const amount = parseFloat(row.amt) || 0;
        const categoryRaw = row.category || 'unknown';
        const ccNum = row.cc_num || row.trans_num;

        merchantCounts.set(ccNum, (merchantCounts.get(ccNum) || 0) + 1);

        const state = row.state || '';
        const base = {
          transaction_id: row.trans_num,
          amount,
          category: formatCategoryLabel(categoryRaw),
          category_raw: categoryRaw,
          timestamp: row.trans_date_trans_time,
          merchant: row.merchant,
          cc_num: ccNum,
          city: row.city || '',
          state,
          region: getRegionFromState(state),
        };

        const velocity = merchantCounts.get(ccNum) || 1;
        const enterprise = computeEnterpriseRisk(base, velocity);

        frauds.push({
          ...base,
          hour: enterprise.hour,
          risk_score: enterprise.risk_score,
          risk_level: enterprise.risk_level,
          alert_level: enterprise.alert_level,
          status: enterprise.status,
          velocity_fraud: velocity,
        });
      })
      .on('end', () => {
        frauds.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        const categories = computeCategoriesFromTransactions(frauds);
        const elapsed = Date.now() - start;

        console.log(`[DATA] CSV parsed in ${elapsed}ms — ${frauds.length} fraud records`);
        resolve({ frauds, categories });
      })
      .on('error', reject);
  });
}

function buildAlerts(hours, categories, kpis, filteredTx = null) {
  const alerts = [];
  const fraudRate = kpis?.[0]?.taxa_fraude ?? 0;

  if (hours?.length) {
    const avg = hours.reduce((s, r) => s + (r.qtd_fraudes || 0), 0) / hours.length;
    hours.forEach((row, index) => {
      const count = row.qtd_fraudes || 0;
      if (count <= avg * 1.8) return;
      alerts.push({
        id: `ALT-H${String(index).padStart(2, '0')}`,
        severity: count > avg * 2.5 ? 'critical' : 'high',
        title: `Fraud spike detected at ${String(index).padStart(2, '0')}:00`,
        description: `${count} fraud cases (${Math.round((count / avg - 1) * 100)}% above hourly average)`,
        time: `${index}h window`,
        category: 'Risk Monitoring',
        source: 'hourly_analysis',
      });
    });
  }

  categories?.slice(0, 3).forEach((cat, index) => {
    alerts.push({
      id: `ALT-C${String(index + 1).padStart(2, '0')}`,
      severity: index === 0 ? 'critical' : index === 1 ? 'high' : 'medium',
      title: `Elevated fraud activity in ${cat.category || cat.category_raw}`,
      description: `${cat.qtd_fraudes} frauds · $${Math.round(cat.volume_fraude).toLocaleString('en-US')} volume`,
      time: 'Filtered window',
      category: cat.category || formatCategoryLabel(cat.category_raw),
      source: 'category_analysis',
    });
  });

  if (fraudRate > 0.5) {
    alerts.unshift({
      id: 'ALT-RATE',
      severity: 'critical',
      title: 'Fraud rate above industry benchmark',
      description: `Current rate ${Number(fraudRate).toFixed(2)}% exceeds benchmark of 0.42%`,
      time: 'Live',
      category: 'Fraud Analytics',
      source: 'kpi_analysis',
    });
  }

  if (filteredTx?.length) {
    const critical = filteredTx.filter((t) => t.risk_level === 'CRITICAL').length;
    if (critical > 0) {
      alerts.unshift({
        id: 'ALT-CRIT',
        severity: 'critical',
        ai_severity: 'CRITICAL',
        title: `${critical} CRITICAL risk transactions in current filter`,
        description: 'Immediate review recommended for high-risk filtered subset',
        time: 'Live',
        category: 'Risk Scoring',
        source: 'filter_analysis',
      });
    }

    const { buildAiAlerts } = require('../services/fraudIntelligenceService');
    const aiAlerts = buildAiAlerts(filteredTx).slice(0, 5);
    alerts.unshift(...aiAlerts);
  }

  const { normalizeAlertSeverity } = require('../services/fraudIntelligenceService');
  return alerts.slice(0, 30).map(normalizeAlertSeverity);
}

function buildModels(kpis) {
  const data = kpis?.[0] ?? {};
  const fraudRate = data.taxa_fraude ?? 0;
  const accuracyBase = Math.max(88, 99.2 - fraudRate * 0.8);

  return [
    { name: 'fraud-detector-v3', status: fraudRate > 0.55 ? 'alerting' : 'healthy', accuracy: Number((accuracyBase + 0.3).toFixed(1)), latency: 42, alerts: fraudRate > 0.55 ? 2 : 0, lastTrain: '2026-06-03' },
    { name: 'risk-scorer-v2', status: 'healthy', accuracy: Number((accuracyBase - 1.2).toFixed(1)), latency: 28, alerts: 0, lastTrain: '2026-06-01' },
    { name: 'velocity-check-v1', status: fraudRate > 0.5 ? 'degraded' : 'healthy', accuracy: Number((accuracyBase - 3.5).toFixed(1)), latency: 15, alerts: fraudRate > 0.5 ? 1 : 0, lastTrain: '2026-05-28' },
    { name: 'anomaly-net-v4', status: 'healthy', accuracy: Number((accuracyBase - 0.8).toFixed(1)), latency: 67, alerts: 0, lastTrain: '2026-05-25' },
    { name: 'category-classifier', status: 'healthy', accuracy: Number((accuracyBase - 2.1).toFixed(1)), latency: 35, alerts: 0, lastTrain: '2026-05-20' },
    { name: 'behavioral-v2', status: fraudRate > 0.58 ? 'alerting' : 'healthy', accuracy: Number((accuracyBase - 4.2).toFixed(1)), latency: 52, alerts: fraudRate > 0.58 ? 1 : 0, lastTrain: '2026-05-15' },
  ];
}

async function initializeData() {
  if (cache.loading) return cache.loading;

  cache.loading = (async () => {
    console.log('[DATA] Initializing FraudShield data store...');
    loadGoldData();

    try {
      const { frauds, categories } = await loadFraudTransactionsFromCsv();
      const { enrichTransactions } = require('../ml/pipelines/fraudPipeline');
      const { analyzeDataset } = require('../services/dataAnalysisService');
      cache.transactions = enrichTransactions(frauds);
      cache.analyticsReport = analyzeDataset(cache.transactions);
      if (categories.length > 0) cache.categories = categories;
      cache.hours = computeHoursFromTransactions(cache.transactions);
    } catch (err) {
      console.error('[DATA] CSV load failed:', err.message);
      cache.transactions = [];
    }

    cache.alerts = buildAlerts(cache.hours, cache.categories, cache.kpis);
    cache.models = buildModels(cache.kpis);
    cache.stats = {
      transactions: cache.transactions.length,
      categories: cache.categories.length,
      hours: cache.hours.length,
      alerts: cache.alerts.length,
    };
    cache.ready = true;
    console.log('[DATA] Ready:', cache.stats);
  })();

  return cache.loading;
}

function getCache() {
  return cache;
}

function rebuildAlerts(filteredTx, filteredKpis, filteredHours, filteredCategories) {
  return buildAlerts(
    filteredHours ?? cache.hours,
    filteredCategories ?? cache.categories,
    filteredKpis ?? cache.kpis,
    filteredTx,
  );
}

module.exports = {
  initializeData,
  getCache,
  rebuildAlerts,
  buildModels,
  CSV_PATH,
  GOLD_DIR,
};
