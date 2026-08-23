export default function AlumniLoading() {
  return (
    <div className="w-full bg-background min-h-[calc(100vh-80px)] px-6 md:px-10 pt-4 md:pt-6 pb-20 animate-pulse space-y-12">
      {/* Hero Header Lockup */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-8">
        <div className="space-y-3">
          <div className="h-16 md:h-28 w-80 md:w-120 bg-foreground/10 rounded-3xl" />
        </div>
        <div className="h-6 w-56 bg-foreground/10 rounded-full shrink-0" />
      </div>

      {/* Cohort Section Skeleton */}
      <div className="space-y-12">
        <div className="border-b-2 border-double border-border pb-3">
          <div className="h-8 w-48 bg-foreground/10 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="w-full aspect-4/4.3 border-2 border-border p-3 space-y-3 flex flex-col justify-between bg-card"
            >
              <div className="w-full aspect-4/4.3 bg-foreground/10" />
              <div className="space-y-1.5 pt-1">
                <div className="h-5 w-3/4 bg-foreground/10 rounded" />
                <div className="h-3 w-1/2 bg-foreground/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
