import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class OverviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Overview:ErrorBoundary]', error?.message, error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                Overview section failed to render
              </h3>
              <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
                {this.state.error?.message ?? 'An unexpected error occurred.'}
              </p>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-[12px] font-medium text-white hover:bg-slate-800 dark:bg-cyan-600"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry section
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
