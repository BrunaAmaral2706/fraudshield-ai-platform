import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, FileText, LayoutDashboard } from 'lucide-react';
import { useGlobalSearch } from '../context/SearchContext';
import { SEARCH_PAGES } from '../utils/navigation';
import { fetchTransactions } from '../services/api';

export default function GlobalSearch() {
  const { isOpen, query, setQuery, closeSearch } = useGlobalSearch();
  const navigate = useNavigate();
  const [txResults, setTxResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function searchTransactions() {
      setSearching(true);
      try {
        const res = await fetchTransactions({
          search: query,
          limit: 5,
          page: 1,
        });
        if (!cancelled) setTxResults(res.data ?? []);
      } catch {
        if (!cancelled) setTxResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }

    const timer = setTimeout(searchTransactions, query ? 200 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  const pageResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SEARCH_PAGES.slice(0, 4);
    return SEARCH_PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.includes(q) || q.includes(k)),
    );
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    navigate(path);
    closeSearch();
  };

  const hasResults = pageResults.length > 0 || txResults.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={closeSearch}
        aria-label="Close search"
      />
      <div className="relative z-10 w-full max-w-lg animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-700">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, transactions..."
            className="flex-1 bg-transparent py-3.5 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-600 dark:bg-slate-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {searching && (
            <p className="px-3 py-4 text-center text-[12px] text-slate-400">Searching...</p>
          )}

          {!searching && !hasResults && query && (
            <p className="px-3 py-8 text-center text-[13px] text-slate-400">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {pageResults.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Pages
              </p>
              {pageResults.map((page) => (
                <button
                  key={page.path}
                  type="button"
                  onClick={() => handleSelect(page.path)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <LayoutDashboard className="h-4 w-4 text-slate-400" />
                  <span className="flex-1 text-[13px] font-medium text-slate-700 dark:text-slate-200">
                    {page.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {txResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Transactions
              </p>
              {txResults.map((tx) => (
                <button
                  key={tx.transaction_id}
                  type="button"
                  onClick={() => handleSelect('/transactions')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12px] font-medium text-slate-700 dark:text-slate-200">
                      {tx.transaction_id}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {tx.category} · {tx.status}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
