import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';
import { fetchTransactions } from '../services/api';
import { useFilters } from '../context/FilterContext';
import { useFraudStore } from '../stores/fraudStore';

export function useTransactions(initialPageSize = 10, useGlobalFilters = true) {
  const { queryParams } = useFilters();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sort, setSort] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...(useGlobalFilters ? queryParams : {}),
        search: debouncedSearch || queryParams.search || undefined,
        status: statusFilter !== 'all' ? statusFilter : queryParams.status,
        category: categoryFilter !== 'all' ? categoryFilter : queryParams.category,
        risk_level: riskFilter !== 'all' ? riskFilter : queryParams.risk_level,
        period: queryParams.period,
        region: queryParams.region,
        page,
        limit: pageSize,
        sort,
        order,
      };

      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === 'all' || params[k] === '') {
          delete params[k];
        }
      });

      const res = await fetchTransactions(params);
      setTransactions(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
      if (res.filters?.categories) setCategories(res.filters.categories);
      if (res.filters?.regions) {
        useFraudStore.getState().setRegions(res.filters.regions.filter((r) => r !== 'all'));
      }
    } catch (err) {
      setError(err.message);
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    categoryFilter,
    riskFilter,
    page,
    pageSize,
    sort,
    order,
    queryParams,
    useGlobalFilters,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, riskFilter, sort, order, queryParams]);

  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setRiskFilter('all');
    setSort('timestamp');
    setOrder('desc');
    setPage(1);
  };

  const toggleSort = (field) => {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('desc');
    }
  };

  return {
    transactions,
    total,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    riskFilter,
    setRiskFilter,
    categories,
    page,
    totalPages,
    pageSize,
    sort,
    order,
    toggleSort,
    goToPage,
    nextPage,
    prevPage,
    resetFilters,
    isEmpty: !loading && transactions.length === 0,
    loading,
    error,
    refetch: load,
  };
}
