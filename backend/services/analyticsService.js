/**
 * Analytics service — filtered datasets, KPIs, aggregations.
 */
const { getCache, rebuildAlerts } = require('../database/dataStore');
const {
  parseFilters,
  applyTransactionFilters,
  sortTransactions,
  paginate,
  computeKpisFromTransactions,
  computeCategoriesFromTransactions,
  computeHoursFromTransactions,
} = require('../lib/filters');

function getFilteredDataset(query) {
  const cache = getCache();
  const filters = parseFilters(query);
  const filtered = applyTransactionFilters(cache.transactions ?? [], filters);

  const kpis = computeKpisFromTransactions(filtered, cache.kpis);
  const categories = computeCategoriesFromTransactions(filtered);
  const hours = computeHoursFromTransactions(filtered);

  return {
    filters,
    filtered,
    kpis,
    categories,
    hours,
    alerts: rebuildAlerts(filtered, kpis, hours, categories),
  };
}

function getTransactionsPage(query) {
  const cache = getCache();
  const { filters, filtered } = getFilteredDataset(query);
  const sorted = sortTransactions(filtered, filters.sort, filters.order);
  const result = paginate(sorted, filters.page, filters.limit);

  const filterOptions = {
    categories: ['all', ...new Set((cache.transactions ?? []).map((t) => t.category))],
    category_raw: ['all', ...new Set((cache.transactions ?? []).map((t) => t.category_raw))],
    regions: ['all', ...new Set((cache.transactions ?? []).map((t) => t.region).filter(Boolean))],
    statuses: ['all', 'blocked', 'review', 'flagged'],
    risk_levels: ['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    periods: ['all', '24h', '7d', '30d'],
  };

  return {
    ...result,
    filters: filterOptions,
    meta: { applied: filters },
  };
}

module.exports = {
  getFilteredDataset,
  getTransactionsPage,
  sortTransactions,
  paginate,
};
