import {
  LayoutDashboard,
  BarChart3,
  ArrowLeftRight,
  Bell,
  BrainCircuit,
  Settings,
  Sparkles,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    label: 'Monitor',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
      { id: 'analytics', label: 'Fraud Analytics', icon: BarChart3, path: '/analytics' },
      { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, path: '/transactions' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'ai-monitoring', label: 'AI Monitoring', icon: Sparkles, path: '/ai-monitoring' },
      { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts', badge: 12 },
      { id: 'models', label: 'Models', icon: BrainCircuit, path: '/models' },
    ],
  },
  {
    label: 'Platform',
    items: [{ id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }],
  },
];

export const SEARCH_PAGES = [
  { label: 'Overview', path: '/', keywords: ['dashboard', 'home', 'kpi'] },
  { label: 'Fraud Analytics', path: '/analytics', keywords: ['charts', 'graphs', 'fraud'] },
  { label: 'Transactions', path: '/transactions', keywords: ['txn', 'payments'] },
  { label: 'AI Monitoring', path: '/ai-monitoring', keywords: ['ml', 'ai', 'anomaly', 'prediction'] },
  { label: 'Alerts', path: '/alerts', keywords: ['notifications', 'warnings'] },
  { label: 'Models', path: '/models', keywords: ['ml', 'ai', 'machine learning'] },
  { label: 'Settings', path: '/settings', keywords: ['preferences', 'theme'] },
];
