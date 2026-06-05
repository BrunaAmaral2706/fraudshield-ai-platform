import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { SkeletonDashboard } from './components/ui/Skeleton';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const AiMonitoringPage = lazy(() => import('./pages/AiMonitoringPage'));
const ModelsPage = lazy(() => import('./pages/ModelsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageLoader() {
  return (
    <div className="p-6">
      <SkeletonDashboard />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="ai-monitoring" element={<AiMonitoringPage />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
