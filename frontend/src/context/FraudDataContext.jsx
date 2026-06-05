/**
 * FraudDataContext — exposes Zustand store (backward compatible).
 */
import { useFraudStore } from '../stores/fraudStore';
import { FilterSync } from './FilterContext';

export function FraudDataProvider({ children }) {
  return <FilterSync>{children}</FilterSync>;
}

export function useFraudData() {
  const kpis = useFraudStore((s) => s.kpis);
  const categoryData = useFraudStore((s) => s.categoryData);
  const hourData = useFraudStore((s) => s.hourData);
  const alerts = useFraudStore((s) => s.alerts);
  const models = useFraudStore((s) => s.models);
  const summary = useFraudStore((s) => s.summary);
  const categories = useFraudStore((s) => s.categories);
  const regions = useFraudStore((s) => s.regions);
  const loading = useFraudStore((s) => s.loading);
  const error = useFraudStore((s) => s.error);
  const apiOnline = useFraudStore((s) => s.apiOnline);
  const refetch = useFraudStore((s) => s.fetchAll);

  return {
    kpis,
    categoryData,
    hourData,
    alerts,
    models,
    summary,
    categories,
    regions,
    loading,
    error,
    apiOnline,
    refetch,
  };
}
