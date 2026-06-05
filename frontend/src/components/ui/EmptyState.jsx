import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'Try adjusting your filters or search query.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
