import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import KpiCards from '../components/KpiCards';
import Charts from '../components/Charts';
import TransactionsTable from '../components/TransactionsTable';
import TransactionDetailModal from '../components/transactions/TransactionDetailModal';
import ErrorBanner from '../components/ui/ErrorBanner';
import GlobalFilters from '../components/filters/GlobalFilters';
import { OverviewErrorBoundary } from '../components/ui/OverviewErrorBoundary';
import { SkeletonDashboard } from '../components/ui/Skeleton';
import { useFraudData } from '../context/FraudDataContext';
import { useTransactions } from '../hooks/useTransactions';
import { formatCompact } from '../utils/formatters';
import { ensureArray } from '../utils/safeData';

export default function OverviewPage() {
  const { kpis, categoryData, hourData, alerts, categories, summary, loading, error, refetch } = useFraudData();
  const tx = useTransactions(5);
  const [selected, setSelected] = useState(null);

  const safeAlerts = ensureArray(alerts, 'alerts');
  const safeCategories = ensureArray(categories, 'categories');
  const kpi = Array.isArray(kpis) && kpis.length ? kpis[0] : null;

  const criticalAlerts = safeAlerts.filter(
    (a) => a?.severity === 'critical' || a?.ai_severity === 'CRITICAL',
  );

  const subtitle = kpi
    ? `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${formatCompact(kpi.total_transacoes)} transactions monitored · ${criticalAlerts.length} critical alerts`
    : loading
      ? 'Loading fraud analytics...'
      : 'Fraud analytics overview';

  const alertMessage =
    criticalAlerts.length > 0
      ? `${criticalAlerts.length} critical alert${criticalAlerts.length > 1 ? 's' : ''} — ${criticalAlerts[0]?.title ?? 'Review required'}`
      : undefined;

  if (loading && !kpis) {
    return (
      <>
        <Header title="Fraud Analytics Overview" subtitle="Loading dataset..." showAlert={false} />
        <div className="mt-6">
          <SkeletonDashboard />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Fraud Analytics Overview"
        subtitle={subtitle}
        showAlert={criticalAlerts.length > 0}
        alertMessage={alertMessage}
      />

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onRetry={refetch} />
        </div>
      )}

      <div className="mt-6 space-y-6">
        <OverviewErrorBoundary>
          <GlobalFilters categories={safeCategories} />
        </OverviewErrorBoundary>

        <OverviewErrorBoundary>
          <KpiCards
            kpis={kpis}
            alerts={safeAlerts}
            summary={summary}
            loading={loading}
            empty={!loading && (!Array.isArray(kpis) || !kpis.length)}
          />
        </OverviewErrorBoundary>

        <OverviewErrorBoundary>
          <Charts
            hourData={hourData}
            categoryData={categoryData}
            loading={loading}
            variant="overview"
          />
        </OverviewErrorBoundary>

        <OverviewErrorBoundary>
          <TransactionsTable
            {...tx}
            transactions={ensureArray(tx.transactions, 'transactions')}
            categories={ensureArray(tx.categories, 'tx-categories')}
            compact
            showFilters={false}
            onRowClick={setSelected}
          />
        </OverviewErrorBoundary>

        <TransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />

        <div className="text-center">
          <Link
            to="/transactions"
            className="text-[13px] font-medium text-cyan-600 transition-colors hover:text-cyan-700 dark:text-cyan-400"
          >
            View all transactions →
          </Link>
        </div>
      </div>
    </>
  );
}
