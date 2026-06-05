import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronsUpDown,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NAV_SECTIONS } from '../utils/navigation';
import { useGlobalSearch } from '../context/SearchContext';
import { useFraudData } from '../context/FraudDataContext';

function NavItem({ item }) {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }) =>
          `group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
            isActive
              ? 'bg-cyan-50/80 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-cyan-500 transition-all" />
            )}
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}
              strokeWidth={isActive ? 2.25 : 2}
            />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

export default function Sidebar() {
  const { openSearch } = useGlobalSearch();
  const { alerts } = useFraudData();
  const [mobileOpen, setMobileOpen] = useState(false);

  const alertCount = alerts?.length ?? 0;
  const criticalCount = alerts?.filter((a) => a.severity === 'critical' || a.ai_severity === 'CRITICAL').length ?? 0;

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.id !== 'alerts') return item;
      return {
        ...item,
        badge: alertCount > 0 ? (criticalCount > 0 ? criticalCount : alertCount) : undefined,
      };
    }),
  }));

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow-sm">
          <ShieldAlert className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
            FraudShield
          </span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            v2.4
          </span>
        </div>
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-100 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
              F
            </div>
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
              FraudShield AI
            </span>
            <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
              Pro
            </span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={openSearch}
          className="relative flex w-full items-center rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-12 text-left transition-shadow hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500"
        >
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <span className="text-[13px] text-slate-400">Search...</span>
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-600 dark:bg-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" onClick={() => setMobileOpen(false)}>
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-slate-700">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-[11px] font-semibold text-white">
            BA
          </div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              Bruna Amaral
            </p>
            <p className="text-[11px] text-slate-400">bruna@fraudshield.io</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm md:hidden dark:border-slate-600 dark:bg-slate-800"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
          aria-label="Close menu"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
