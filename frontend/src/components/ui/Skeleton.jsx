export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-700/50 ${className}`}
    />
  );
}

export function SkeletonCard({ className = 'h-[88px]' }) {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 ${className}`}>
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-[240px] w-full rounded-lg" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-100 p-5 dark:border-slate-700">
        <Skeleton className="h-4 w-48" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-slate-50 px-5 py-4 last:border-0 dark:border-slate-700/50">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonTable rows={5} />
    </div>
  );
}
