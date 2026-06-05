import { Search, ChevronLeft, ChevronRight, Filter, X, ArrowUpDown } from 'lucide-react';
import { STATUS_OPTIONS, RISK_LEVEL_STYLES, ML_PREDICTION_STYLES, AI_SEVERITY_STYLES, formatProbability } from '../utils/formatters';
import EmptyState from './ui/EmptyState';
import { SkeletonTable } from './ui/Skeleton';

const STATUS_STYLES = {
  blocked: {
    label: 'BLOCKED',
    className: 'bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900',
    accent: 'bg-red-500',
    rowBg: 'bg-red-50/30 dark:bg-red-950/20',
  },
  review: {
    label: 'REVIEW',
    className: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400 dark:ring-cyan-900',
    accent: 'bg-cyan-500',
    rowBg: 'bg-cyan-50/30 dark:bg-cyan-950/20',
  },
  flagged: {
    label: 'FLAGGED',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900',
    accent: 'bg-amber-400',
    rowBg: 'bg-amber-50/20 dark:bg-amber-950/15',
  },
  approved: {
    label: 'APPROVED',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900',
    accent: 'bg-emerald-500',
    rowBg: '',
  },
};

function RiskBar({ score }) {
  const color =
    score >= 90 ? 'bg-red-500' : score >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="font-mono text-[12px] font-medium text-slate-700 dark:text-slate-300">
        {score}
      </span>
    </div>
  );
}

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatAmount(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function TransactionsTable({
  transactions,
  total,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  page,
  totalPages,
  goToPage,
  prevPage,
  nextPage,
  resetFilters,
  isEmpty,
  loading = false,
  compact = false,
  showFilters = true,
  sort,
  order,
  toggleSort,
  onRowClick,
  showAiColumns = false,
}) {
  if (loading) return <SkeletonTable rows={compact ? 5 : 8} />;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
              {compact ? 'Latest Suspicious Transactions' : 'Suspicious Transactions'}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {compact
                ? 'Real-time flagged transactions requiring review'
                : `${total} transactions matching current filters`}
            </p>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ID or category..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none transition-shadow focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 sm:w-52 dark:border-slate-600 dark:bg-slate-900 dark:focus:border-cyan-600 dark:focus:ring-cyan-900"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-[13px] outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-900"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-[13px] outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-900"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All categories' : cat}
                  </option>
                ))}
              </select>

              {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[12px] text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="p-6">
          <EmptyState
            title="No transactions found"
            description="Try adjusting your search or filter criteria."
            action={
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500"
              >
                Reset filters
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
              {[
                { key: 'transaction_id', label: 'Transaction ID', sortable: false },
                { key: 'amount', label: 'Amount', sortable: true },
                { key: 'category', label: 'Category', sortable: true },
                { key: 'risk_score', label: 'Risk Score', sortable: true },
                ...(showAiColumns
                  ? [
                      { key: 'fraud_probability', label: 'Fraud Prob.', sortable: false },
                      { key: 'ml_prediction', label: 'ML Prediction', sortable: false },
                      { key: 'severity', label: 'Severity', sortable: false },
                    ]
                  : []),
                { key: 'status', label: 'Status', sortable: false },
                { key: 'timestamp', label: 'Timestamp', sortable: true },
              ].map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400"
                >
                  {col.sortable && toggleSort ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-slate-600"
                    >
                      {col.label}
                      <ArrowUpDown
                        className={`h-3 w-3 ${sort === col.key ? 'text-cyan-600' : 'text-slate-300'}`}
                      />
                      {sort === col.key && (
                        <span className="sr-only">{order}</span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => {
                  const status = STATUS_STYLES[tx.status] ?? STATUS_STYLES.flagged;
                  const isHighlighted = idx === 0 && page === 1;

                  return (
                    <tr
                      key={tx.transaction_id}
                      onClick={() => onRowClick?.(tx)}
                      className={`group border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60 dark:border-slate-700/50 dark:hover:bg-slate-700/30 ${
                        isHighlighted ? status.rowBg : ''
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      <td className="relative px-5 py-3.5">
                        {isHighlighted && (
                          <span
                            className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${status.accent}`}
                          />
                        )}
                        <span className="font-mono text-[12px] font-medium text-slate-800 dark:text-slate-200">
                          {tx.transaction_id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[12px] font-semibold text-slate-900 dark:text-white">
                          {formatAmount(tx.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-slate-600 dark:text-slate-400">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <RiskBar score={tx.risk_score} />
                          {tx.risk_level && (
                            <span
                              className={`inline-flex w-fit rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${RISK_LEVEL_STYLES[tx.risk_level] ?? RISK_LEVEL_STYLES.MEDIUM}`}
                            >
                              {tx.risk_level}
                            </span>
                          )}
                        </div>
                      </td>
                      {showAiColumns && (
                        <>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-[12px] font-medium text-slate-700 dark:text-slate-300">
                              {formatProbability(tx.fraud_probability)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {tx.ml_prediction && (
                              <span
                                className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${ML_PREDICTION_STYLES[tx.ml_prediction] ?? ML_PREDICTION_STYLES.SUSPICIOUS}`}
                              >
                                {tx.ml_prediction}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {tx.severity && (
                              <span
                                className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold tracking-wide ${AI_SEVERITY_STYLES[tx.severity] ?? AI_SEVERITY_STYLES.INFO}`}
                              >
                                {tx.severity}
                              </span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-slate-400">
                          {formatTimestamp(tx.timestamp)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!compact && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-700">
              <p className="text-[12px] text-slate-400">
                Page {page} of {totalPages} · {total} results
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevPage}
                  disabled={page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${
                        page === p
                          ? 'bg-cyan-600 text-white'
                          : 'border border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={nextPage}
                  disabled={page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
