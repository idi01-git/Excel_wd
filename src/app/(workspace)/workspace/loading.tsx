// src/app/(workspace)/workspace/loading.tsx

export default function WorkspaceLoadingSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 animate-pulse">
      {/* ── Page Header Skeleton ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12 border-b border-gray-200 dark:border-neutral-800 pb-6 sm:pb-8">
        <div className="space-y-2.5">
          <div className="h-3 w-28 bg-gray-200 dark:bg-neutral-800 rounded" />
          <div className="h-9 sm:h-12 w-48 sm:w-64 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-4 w-72 sm:w-96 bg-gray-200/70 dark:bg-neutral-800/70 rounded" />
        </div>
        <div className="h-11 w-36 bg-gray-200 dark:bg-neutral-800 rounded-full" />
      </div>

      {/* ── Stats Row Skeleton ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 md:gap-6 mb-10 sm:mb-12">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex flex-col p-5 sm:p-6 rounded-3xl border border-gray-200/60 dark:border-neutral-800 bg-gray-50/70 dark:bg-neutral-900/50 h-32 sm:h-36 justify-between"
          >
            <div className="h-3.5 w-24 bg-gray-200 dark:bg-neutral-800 rounded" />
            <div className="h-8 sm:h-10 w-12 bg-gray-200 dark:bg-neutral-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* ── Status Tabs & View Toggle Skeleton ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-gray-100 dark:border-neutral-800 pb-5">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-neutral-900 rounded-full">
          <div className="h-7 w-20 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-7 w-28 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-7 w-24 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-7 w-32 bg-gray-200 dark:bg-neutral-800 rounded-full" />
        </div>

        <div className="h-8 w-28 bg-gray-200 dark:bg-neutral-800 rounded-full" />
      </div>

      {/* ── List Items Skeleton ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200/70 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-neutral-800 shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-neutral-800 rounded" />
              <div className="flex items-center gap-2">
                <div className="h-3 w-14 bg-gray-200/70 dark:bg-neutral-800/70 rounded-full" />
                <div className="h-3 w-20 bg-gray-200/60 dark:bg-neutral-800/60 rounded" />
              </div>
            </div>
            <div className="h-7 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
