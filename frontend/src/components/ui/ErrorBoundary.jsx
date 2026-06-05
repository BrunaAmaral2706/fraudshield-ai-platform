import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6 dark:bg-slate-950">
          <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-900 dark:bg-slate-800">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="mt-2 text-[13px] text-slate-500">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 dark:bg-cyan-600"
            >
              <RefreshCw className="h-4 w-4" />
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
