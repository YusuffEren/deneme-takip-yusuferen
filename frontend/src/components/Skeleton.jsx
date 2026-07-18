export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 ${className}`}>
      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
      <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
    </div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 ${className}`}>
      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
      <div className="h-3 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-6" />
      <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 4, className = '' }) {
  return (
    <div className={`bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 ${className}`}>
      <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-3">
          <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ className = '' }) {
  return (
    <div className={`bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden ${className}`}>
      <div className="p-4 border-b border-slate-200 dark:border-white/5">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
