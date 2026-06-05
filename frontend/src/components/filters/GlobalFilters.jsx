import {
  Calendar,
  Filter,
  Globe,
  RotateCcw,
  Search,
  Shield,
  Tag,
} from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useFraudData } from '../../context/FraudDataContext';

const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const RISK_LEVELS = [
  { value: 'all', label: 'All risk levels' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'review', label: 'Review' },
  { value: 'flagged', label: 'Flagged' },
];

export default function GlobalFilters({ categories = ['all'], compact = false }) {
  const { filters, updateFilter, resetFilters, hasActiveFilters } = useFilters();
  const { regions = ['all'] } = useFraudData();

  const selectClass =
    'rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[13px] outline-none transition-shadow focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-cyan-600" />
          <span className="text-[13px] font-semibold text-slate-800 dark:text-white">
            Dynamic Filters
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-cyan-600"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 dark:border-slate-600 dark:bg-slate-900"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={filters.period}
            onChange={(e) => updateFilter('period', e.target.value)}
            className={`${selectClass} w-full pl-9`}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className={`${selectClass} w-full pl-9`}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Shield className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={filters.risk_level}
            onChange={(e) => updateFilter('risk_level', e.target.value)}
            className={`${selectClass} w-full pl-9`}
          >
            {RISK_LEVELS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className={`${selectClass} w-full`}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="relative">
          <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={filters.region}
            onChange={(e) => updateFilter('region', e.target.value)}
            className={`${selectClass} w-full pl-9`}
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region === 'all' ? 'All regions' : region}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
