/**
 * FilterContext — thin wrapper over Zustand store (backward compatible).
 */
import { useEffect, useMemo } from 'react';
import { useFraudStore, selectQueryParams } from '../stores/fraudStore';

export function FilterProvider({ children }) {
  return children;
}

export function useFilters() {
  const filters = useFraudStore((s) => s.filters);
  const updateFilter = useFraudStore((s) => s.setFilter);
  const resetFilters = useFraudStore((s) => s.resetFilters);
  const queryParams = useMemo(
    () => selectQueryParams({ filters }),
    [filters],
  );
  const hasActiveFilters = useMemo(
    () => Object.keys(queryParams).length > 0,
    [queryParams],
  );

  return { filters, updateFilter, resetFilters, queryParams, hasActiveFilters };
}

export function FilterSync({ children }) {
  const filters = useFraudStore((s) => s.filters);
  const fetchAll = useFraudStore((s) => s.fetchAll);

  useEffect(() => {
    fetchAll();
  }, [filters, fetchAll]);

  return children;
}
