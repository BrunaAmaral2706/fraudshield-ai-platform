import { create } from 'zustand';
import {
  checkHealth,
  fetchKpis,
  fetchFraudesCategorias,
  fetchFraudesHorarios,
  fetchAlerts,
  fetchModels,
  fetchAnalyticsSummary,
} from '../services/api';
import { ensureArray } from '../utils/safeData';

function normalizeKpis(res) {
  const rows = ensureArray(res, 'kpis');
  return rows.length ? rows : null;
}

export const DEFAULT_FILTERS = {
  period: 'all',
  category: 'all',
  status: 'all',
  risk_level: 'all',
  region: 'all',
  search: '',
};

function buildQueryParams(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v && v !== 'all' && v !== ''),
  );
}

export const useFraudStore = create((set, get) => ({
  filters: { ...DEFAULT_FILTERS },
  kpis: null,
  categoryData: null,
  hourData: null,
  alerts: null,
  models: null,
  summary: null,
  categories: ['all'],
  regions: ['all'],
  loading: true,
  error: null,
  apiOnline: false,

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  fetchAll: async () => {
    const { filters } = get();
    const params = buildQueryParams(filters);

    set({ loading: true, error: null });

    try {
      const health = await checkHealth();
      if (!health.ready) {
        console.warn('[API] Backend loading — retry in 3s');
        set({ apiOnline: false, error: 'API is loading dataset. Retrying...', loading: true });
        setTimeout(() => get().fetchAll(), 3000);
        return;
      }
      set({ apiOnline: true });

      const [kpiRes, catRes, hourRes, alertsRes, modelsRes, summaryRes] =
        await Promise.all([
          fetchKpis(params),
          fetchFraudesCategorias(params),
          fetchFraudesHorarios(params),
          fetchAlerts(params),
          fetchModels(params),
          fetchAnalyticsSummary(params),
        ]);

      const kpis = normalizeKpis(kpiRes);
      const categoryData = ensureArray(catRes, 'categories');
      const hourData = ensureArray(hourRes, 'hours');
      const alerts = ensureArray(alertsRes, 'alerts');
      const models = ensureArray(modelsRes, 'models');
      const catList = categoryData.map((c) => c?.category || c?.category_raw).filter(Boolean);

      set({
        kpis,
        categoryData,
        hourData,
        alerts,
        models,
        summary: summaryRes && typeof summaryRes === 'object' ? summaryRes : null,
        categories: ['all', ...new Set(catList)],
        regions: (() => {
          const r = ensureArray(summaryRes?.regions, 'regions');
          return r.length ? r : ['all'];
        })(),
        loading: false,
        error: null,
      });
    } catch (err) {
      set({
        apiOnline: false,
        error: err?.message ?? 'Failed to connect to FraudShield API',
        loading: false,
      });
    }
  },

  setRegions: (regions) => {
    set({ regions: ['all', ...new Set(regions.filter(Boolean))] });
  },
}));

export function selectQueryParams(state) {
  return buildQueryParams(state.filters);
}
