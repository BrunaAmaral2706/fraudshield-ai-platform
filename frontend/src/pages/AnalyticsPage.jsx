import GlobalFilters from '../components/filters/GlobalFilters';
import Header from '../components/Header';
import Charts from '../components/Charts';
import KpiCards from '../components/KpiCards';
import ErrorBanner from '../components/ui/ErrorBanner';
import { useFraudData } from '../context/FraudDataContext';

export default function AnalyticsPage() {
  const { kpis, categoryData, hourData, alerts, categories, loading, error, refetch } = useFraudData();

  return (
    <>
      <Header
        title="Fraud Analytics"
        subtitle="Deep-dive into fraud patterns, categories, and risk activity"
        showAlert={false}
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
          loading={loading}
          empty={!loading && !kpis?.length}
        />
        <Charts
          hourData={hourData}
          categoryData={categoryData}
          loading={loading}
          variant="full"
        />
      </div>
    </>
  );
}
