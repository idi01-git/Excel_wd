// src/app/(main)/profile/[username]/loading.tsx

export default function ProfileLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 animate-pulse">
      {/* ── Profile Header Skeleton ────────────────────────────────────────── */}
      <div className="mb-6 sm:mb-8 border-b border-gray-200/80 dark:border-neutral-800 pb-5 sm:pb-7">
        {/* Top Info Block: Avatar + Name / Handle / Followers */}
        <div className="flex flex-row items-center gap-3.5 sm:gap-6 md:gap-8">
          {/* Avatar Skeleton */}
          <div className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full bg-gray-200 dark:bg-neutral-800" />

          {/* Details Skeleton */}
          <div className="flex-grow min-w-0 flex flex-col justify-center gap-2.5 sm:gap-3">
            {/* Row 1: Name + Role Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-7 sm:h-9 md:h-11 w-44 sm:w-64 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
              <div className="h-5 w-14 bg-gray-200/70 dark:bg-neutral-800/70 rounded-md" />
            </div>

            {/* Row 2: @handle • Followers • Following */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-4 w-20 bg-gray-200/80 dark:bg-neutral-800/80 rounded" />
              <div className="h-3 w-3 bg-gray-200 dark:bg-neutral-800 rounded-full" />
              <div className="h-4 w-24 bg-gray-200/70 dark:bg-neutral-800/70 rounded" />
              <div className="h-3 w-3 bg-gray-200 dark:bg-neutral-800 rounded-full" />
              <div className="h-4 w-24 bg-gray-200/70 dark:bg-neutral-800/70 rounded" />
            </div>
          </div>
        </div>

        {/* Bio Quote Skeleton */}
        <div className="mt-4 sm:mt-5 space-y-2">
          <div className="h-4 w-full sm:w-4/5 bg-gray-200/60 dark:bg-neutral-800/60 rounded" />
          <div className="h-4 w-2/3 sm:w-1/2 bg-gray-200/50 dark:bg-neutral-800/50 rounded" />
        </div>

        {/* Batch Pill Skeleton */}
        <div className="mt-3">
          <div className="h-6 w-24 bg-gray-200/80 dark:bg-neutral-800/80 rounded-full" />
        </div>

        {/* Action Row Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-5">
          {/* 3 Social Media Icons */}
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-800" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-800" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-800" />
          </div>

          {/* Action Buttons on Right */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 sm:w-32 bg-gray-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-9 w-24 sm:w-28 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          </div>
        </div>
      </div>

      {/* ── Catalogue Controls Skeleton ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-neutral-900 rounded-full">
          <div className="h-7 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-7 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-7 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-7 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-7 w-7 bg-gray-200 dark:bg-neutral-800 rounded-full" />
        </div>

        {/* Sort & View Toggle */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-8 w-28 bg-gray-200 dark:bg-neutral-800 rounded-full" />
        </div>
      </div>

      {/* ── Publication Cards Skeleton ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3.5 sm:gap-4.5">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="flex flex-row items-stretch rounded-2xl border border-gray-200/70 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
          >
            {/* Left Thumbnail Skeleton */}
            <div className="w-28 xs:w-36 sm:w-48 aspect-square bg-gray-200 dark:bg-neutral-800 shrink-0" />

            {/* Right Body Skeleton */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4.5 flex-1 min-w-0">
              <div className="space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-neutral-800 rounded-lg" />
                <div className="h-3.5 w-full bg-gray-200/60 dark:bg-neutral-800/60 rounded" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-3 w-16 bg-gray-200/70 dark:bg-neutral-800/70 rounded" />
                <div className="h-3 w-16 bg-gray-200/70 dark:bg-neutral-800/70 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
