import { useState } from 'react';
import Header from '../components/Header';
import TransactionsTable from '../components/TransactionsTable';
import TransactionDetailModal from '../components/transactions/TransactionDetailModal';
import ErrorBanner from '../components/ui/ErrorBanner';
import { useTransactions } from '../hooks/useTransactions';

export default function TransactionsPage() {
  const tx = useTransactions(10);
  const [selected, setSelected] = useState(null);

  return (
    <>
      <Header
        title="Transactions"
        subtitle="Monitor, search, and filter suspicious transaction activity from live fraud dataset"
        showAlert={false}
        showExport
      />

      {tx.error && (
        <div className="mt-5">
          <ErrorBanner message={tx.error} onRetry={tx.refetch} />
        </div>
      )}

      <div className="mt-6">
        <TransactionsTable
          {...tx}
          showFilters
          showAiColumns
          onRowClick={setSelected}
        />
      </div>

      <TransactionDetailModal
        transaction={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
