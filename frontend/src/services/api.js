import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const DEBUG = import.meta.env.DEV;

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
  if (DEBUG) {
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

export const checkHealth = () => request('get', '/health');

export const fetchKpis = (params = {}) => request('get', '/kpis', { params });
export const fetchFraudesCategorias = (params = {}) =>
  request('get', '/fraudes/categorias', { params });
export const fetchFraudesHorarios = (params = {}) =>
  request('get', '/fraudes/horarios', { params });
export const fetchTransactions = (params = {}) =>
  request('get', '/transactions', { params });
export const fetchAlerts = (params = {}) => request('get', '/alertas', { params });
export const fetchModels = (params = {}) => request('get', '/modelos', { params });
export const fetchAnalyticsSummary = (params = {}) =>
  request('get', '/analytics/summary', { params });
export const fetchMlPipeline = () => request('get', '/ml/pipeline');
export const fetchMlMetrics = () => request('get', '/ml/metrics');
export const fetchRiskAnalysis = (params = {}) => request('get', '/risk-analysis', { params });
export const fetchFraudInsights = (params = {}) => request('get', '/fraud-insights', { params });
export const fetchAnomalies = (params = {}) => request('get', '/anomalies', { params });
export const fetchDataAnalysis = () => request('get', '/data-analysis');
export const fetchMlPredictions = (params = {}) => request('get', '/ml-predictions', { params });

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
