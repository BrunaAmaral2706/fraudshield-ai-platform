import { Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  ChevronDown,
  Download,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useGlobalSearch } from '../context/SearchContext';

export default function Header({
  title,
  subtitle,
  showAlert = false,
  alertMessage,
  showSearch = true,
  showExport = true,
}) {
  const { openSearch } = useGlobalSearch();
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="pt-12 md:pt-0">
          <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {subtitle ?? `${today} · Real-time risk engine active`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {showSearch && (
            <button
              type="button"
              onClick={openSearch}
              className="relative hidden items-center gap-2 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-left shadow-sm transition-colors hover:bg-slate-50 md:flex dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <span className="w-44 text-[13px] text-slate-400 lg:w-52">Search...</span>
              <kbd className="ml-2 rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] text-slate-400 dark:border-slate-600 dark:bg-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Last 24h
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 sm:flex dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            All regions
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <ThemeToggle />

          {showExport && (
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500"
            >
              <Download className="h-3.5 w-3.5" />
              Export Report
            </button>
          )}
        </div>
      </div>

      {showAlert && (
        <div className="flex flex-col gap-3 rounded-xl border border-cyan-200/60 bg-gradient-to-r from-cyan-50 to-teal-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-cyan-800/40 dark:from-cyan-950/30 dark:to-teal-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
              <AlertTriangle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-[13px] text-slate-700 dark:text-slate-300">
              {alertMessage ?? (
                <>
                  <span className="font-semibold text-cyan-700 dark:text-cyan-400">
                    Critical alerts detected
                  </span>{' '}
                  — review fraud spikes and suspicious activity
                </>
              )}
            </p>
          </div>
          <Link
            to="/alerts"
            className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-cyan-600 transition-colors hover:text-cyan-700 dark:text-cyan-400"
          >
            View alerts
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </header>
  );
}
