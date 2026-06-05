import { Moon, Sun, Bell, Shield, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import AnimatedCard from '../components/ui/AnimatedCard';

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-[14px] font-medium text-slate-900 dark:text-white">{title}</p>
          <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-cyan-600' : 'bg-slate-200 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      <Header
        title="Settings"
        subtitle="Configure your FraudShield workspace preferences"
        showAlert={false}
        showSearch={false}
        showExport={false}
      />

      <div className="mt-6 max-w-2xl space-y-4">
        <AnimatedCard delay={0}>
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-1 text-[14px] font-semibold text-slate-900 dark:text-white">
              Appearance
            </h3>
            <p className="mb-2 text-[12px] text-slate-400">
              Customize how FraudShield looks on your device
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <SettingRow
                icon={isDark ? Moon : Sun}
                title="Dark mode"
                description="Switch between light and dark themes"
              >
                <Toggle enabled={isDark} onChange={() => toggleTheme()} />
              </SettingRow>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-1 text-[14px] font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <SettingRow
                icon={Bell}
                title="Critical alerts"
                description="Email notifications for critical fraud alerts"
              >
                <Toggle enabled={true} onChange={() => {}} />
              </SettingRow>
              <SettingRow
                icon={Shield}
                title="Model drift alerts"
                description="Notify when ML model accuracy drops"
              >
                <Toggle enabled={true} onChange={() => {}} />
              </SettingRow>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-1 text-[14px] font-semibold text-slate-900 dark:text-white">
              Data
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <SettingRow
                icon={RefreshCw}
                title="Auto-refresh"
                description="Refresh dashboard data every 60 seconds"
              >
                <Toggle enabled={false} onChange={() => {}} />
              </SettingRow>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </>
  );
}
