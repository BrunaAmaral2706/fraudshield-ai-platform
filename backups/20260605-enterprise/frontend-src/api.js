import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Unable to reach FraudShield API';

    const enriched = new Error(message);
    enriched.status = error.response?.status;
    enriched.isNetworkError = !error.response;
    enriched.original = error;
    return Promise.reject(enriched);
  },
);

export const checkHealth = () => api.get('/health').then((res) => res.data);

export const fetchKpis = () => api.get('/kpis').then((res) => res.data);

export const fetchFraudesCategorias = () =>
  api.get('/fraudes/categorias').then((res) => res.data);

export const fetchFraudesHorarios = () =>
  api.get('/fraudes/horarios').then((res) => res.data);

export const fetchTransactions = (params = {}) =>
  api.get('/transacoes', { params }).then((res) => res.data);

export const fetchAlerts = (params = {}) =>
  api.get('/alertas', { params }).then((res) => res.data);

export const fetchModels = () => api.get('/modelos').then((res) => res.data);

export default api;
