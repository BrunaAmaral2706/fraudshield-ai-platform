/**
 * Static API — serves demo data from public/demo/bundle.json on GitHub Pages (no backend).
 */
import {
  getFilteredDataset,
  getTransactionsPage,
  buildSummary,
  buildModels,
} from '../lib/filters';

let bundlePromise = null;

function demoUrl(path) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path}`.replace(/\/+/g, '/').replace(':/', '://');
}

async function loadBundle() {
  if (!bundlePromise) {
    bundlePromise = fetch(demoUrl('demo/bundle.json'))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Demo bundle unavailable (${res.status})`);
        }
        return res.json();
      })
      .catch((err) => {
        bundlePromise = null;
        throw err;
      });
  }
  return bundlePromise;
}

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withBundle(fn) {
  await delay();
  const bundle = await loadBundle();
  return fn(bundle);
}

export async function checkHealth() {
  return withBundle((b) => ({
    ...b.health,
    ready: true,
    static: true,
  }));
}

export async function fetchKpis(params = {}) {
  return withBundle((b) => getFilteredDataset(b.transactions, b.globalKpis, params).kpis);
}

export async function fetchFraudesCategorias(params = {}) {
  return withBundle((b) => getFilteredDataset(b.transactions, b.globalKpis, params).categories);
}

export async function fetchFraudesHorarios(params = {}) {
  return withBundle((b) => getFilteredDataset(b.transactions, b.globalKpis, params).hours);
}

export async function fetchTransactions(params = {}) {
  return withBundle((b) => getTransactionsPage(b.transactions, b.globalKpis, params));
}

export async function fetchAlerts(params = {}) {
  return withBundle((b) => getFilteredDataset(b.transactions, b.globalKpis, params).alerts);
}

export async function fetchModels(params = {}) {
  return withBundle((b) => {
    const { kpis } = getFilteredDataset(b.transactions, b.globalKpis, params);
    return buildModels(kpis);
  });
}

export async function fetchAnalyticsSummary(params = {}) {
  return withBundle((b) => {
    const dataset = getFilteredDataset(b.transactions, b.globalKpis, params);
    return buildSummary(dataset.filtered, dataset, b.transactions, b.globalKpis);
  });
}

export async function fetchMlPipeline() {
  return withBundle((b) => b.mlPipeline);
}

export async function fetchMlMetrics() {
  return withBundle((b) => b.mlMetrics);
}

export async function fetchRiskAnalysis(params = {}) {
  return withBundle((b) => b.riskAnalysis);
}

export async function fetchFraudInsights(params = {}) {
  return withBundle((b) => b.fraudInsights);
}

export async function fetchAnomalies(params = {}) {
  return withBundle((b) => b.anomalies);
}

export async function fetchDataAnalysis() {
  return withBundle((b) => b.dataAnalysis);
}

export async function fetchMlPredictions(params = {}) {
  return withBundle((b) => b.mlPredictions);
}
