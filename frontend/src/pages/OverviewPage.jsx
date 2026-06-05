import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import KpiCards from '../components/KpiCards';
import Charts from '../components/Charts';
import TransactionsTable from '../components/TransactionsTable';
import TransactionDetailModal from '../components/transactions/TransactionDetailModal';
import ErrorBanner from '../components/ui/ErrorBanner';
import GlobalFilters from '../components/filters/GlobalFilters';
import { useFraudData } from '../context/FraudDataContext';
import { useTransactions } from '../hooks/useTransactions';
import { formatCompact } from '../utils/formatters';

export default function OverviewPage() {
  const { kpis, categoryData, hourData, alerts, categories, summary, loading, error, refetch } = useFraudData();
  const tx = useTransactions(5);
  const [selected, setSelected] = useState(null);

  const kpi = kpis?.[0];
  const subtitle = kpi
    ? `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${formatCompact(kpi.total_transacoes)} transactions monitored · ${alerts?.filter((a) => a.severity === 'critical').length ?? 0} critical alerts`
    : undefined;

  const criticalAlerts = alerts?.filter((a) => a.severity === 'critical') ?? [];
  const alertMessage =
    criticalAlerts.length > 0
      ? `${criticalAlerts.length} critical alert${criticalAlerts.length > 1 ? 's' : ''} — ${criticalAlerts[0].title}`
      : undefined;

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
        <GlobalFilters categories={categories} />
        <KpiCards
          kpis={kpis}
          alerts={alerts}
          summary={summary}
          loading={loading}
          empty={!loading && !kpis?.length}
        />
        <Charts
          hourData={hourData}
          categoryData={categoryData}
          loading={loading}
          variant="overview"
        />
        <TransactionsTable {...tx} compact showFilters={false} onRowClick={setSelected} />
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
