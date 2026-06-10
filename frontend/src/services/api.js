import axios from 'axios';
import * as staticApi from './staticApi';

const DEBUG = import.meta.env.DEV;
const LOG_API = import.meta.env.DEV || import.meta.env.VITE_LOG_API === 'true';

export function useStaticApi() {
  if (import.meta.env.VITE_USE_STATIC_API === 'true') return true;
  if (typeof window === 'undefined') return import.meta.env.PROD;
  return (
    window.location.hostname.endsWith('github.io') ||
    window.location.pathname.includes('/fraudshield-ai-platform')
  );
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let retryCount = 0;
const MAX_RETRIES = 2;

function log(method, url, detail) {
  if (LOG_API) {
    console.log(`[API] ${method.toUpperCase()} ${url}`, detail ?? '');
  }
}

api.interceptors.request.use((config) => {
  log(config.method, config.url, config.params);
  return config;
});

api.interceptors.response.use(
  (response) => {
    retryCount = 0;
    log('ok', response.config.url, { status: response.status });
    return response;
  },
  async (error) => {
    const config = error.config;
    if (
      error.isNetworkError ||
      error.code === 'ECONNABORTED' ||
      (error.response?.status >= 500 && retryCount < MAX_RETRIES)
    ) {
      retryCount += 1;
      console.warn(`[API] Retry ${retryCount}/${MAX_RETRIES} → ${config?.url}`);
      await new Promise((r) => setTimeout(r, 1000 * retryCount));
      return api(config);
    }

    const message =
      error.response?.data?.error ||
      error.message ||
      'Unable to reach FraudShield API';

    console.error('[API] Error:', message);
    const enriched = new Error(message);
    enriched.status = error.response?.status;
    enriched.isNetworkError = !error.response;
    return Promise.reject(enriched);
  },
);

async function request(method, url, options = {}) {
  const res = await api[method](url, options.params ? { params: options.params } : options);
  return res.data;
}

async function liveOrStatic(liveFn, staticFn, params) {
  if (useStaticApi()) {
    if (DEBUG) log('static', liveFn.name || 'demo', params);
    return staticFn(params);
  }
  try {
    return await liveFn(params);
  } catch (err) {
    console.warn('[API] Live request failed, falling back to static demo data:', err?.message);
    return staticFn(params);
  }
}

export const checkHealth = () =>
  useStaticApi() ? staticApi.checkHealth() : request('get', '/health');

export const fetchKpis = (params = {}) =>
  liveOrStatic((p) => request('get', '/kpis', { params: p }), staticApi.fetchKpis, params);

export const fetchFraudesCategorias = (params = {}) =>
  liveOrStatic(
    (p) => request('get', '/fraudes/categorias', { params: p }),
    staticApi.fetchFraudesCategorias,
    params,
  );

export const fetchFraudesHorarios = (params = {}) =>
  liveOrStatic(
    (p) => request('get', '/fraudes/horarios', { params: p }),
    staticApi.fetchFraudesHorarios,
    params,
  );

export const fetchTransactions = (params = {}) =>
  liveOrStatic(
    (p) => request('get', '/transactions', { params: p }),
    staticApi.fetchTransactions,
    params,
  );

export const fetchAlerts = (params = {}) =>
  liveOrStatic((p) => request('get', '/alertas', { params: p }), staticApi.fetchAlerts, params);

export const fetchModels = (params = {}) =>
  liveOrStatic((p) => request('get', '/modelos', { params: p }), staticApi.fetchModels, params);

export const fetchAnalyticsSummary = (params = {}) =>
  liveOrStatic(
    (p) => request('get', '/analytics/summary', { params: p }),
    staticApi.fetchAnalyticsSummary,
    params,
  );

export const fetchMlPipeline = () =>
  useStaticApi() ? staticApi.fetchMlPipeline() : request('get', '/ml/pipeline');

export const fetchMlMetrics = () =>
  useStaticApi() ? staticApi.fetchMlMetrics() : request('get', '/ml/metrics');

export const fetchRiskAnalysis = (params = {}) =>
  liveOrStatic(
    (p) => request('get', '/risk-analysis', { params: p }),
    staticApi.fetchRiskAnalysis,
    params,
  );

export const fetchFraudInsights = (params = {}) =>
  liveOrStatic(
    (p) => request('get', '/fraud-insights', { params: p }),
    staticApi.fetchFraudInsights,
    params,
  );

export const fetchAnomalies = (params = {}) =>
  liveOrStatic((p) => request('get', '/anomalies', { params: p }), staticApi.fetchAnomalies, params);

export const fetchDataAnalysis = () =>
  useStaticApi() ? staticApi.fetchDataAnalysis() : request('get', '/data-analysis');

export const fetchMlPredictions = (params = {}) =>
  liveOrStatic(
    (p) => request('get', '/ml-predictions', { params: p }),
    staticApi.fetchMlPredictions,
    params,
  );

/** Enterprise aliases */
export const getKPIs = fetchKpis;
export const getCategories = fetchFraudesCategorias;
export const getFraudHours = fetchFraudesHorarios;
export const getTransactions = fetchTransactions;
export const getAlerts = fetchAlerts;
export const getModels = fetchModels;
export const getAnalyticsSummary = fetchAnalyticsSummary;
export const getMlPredictions = fetchMlPredictions;

export default api;
