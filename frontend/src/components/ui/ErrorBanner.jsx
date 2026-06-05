import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800/50 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="text-[13px] text-amber-800 dark:text-amber-200">
          <span className="font-semibold">API unavailable.</span>{' '}
          {message} — Start the backend with{' '}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[12px] dark:bg-amber-900/50">
            node backend/server.js
          </code>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
