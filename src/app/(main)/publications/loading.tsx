export default function PublicationsLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16 min-h-[calc(100vh-80px)] animate-pulse space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="space-y-3">
          <div className="h-4 w-28 bg-foreground/10 rounded-full" />
          <div className="h-14 md:h-20 w-80 md:w-110 bg-foreground/10 rounded-2xl" />
        </div>
        {/* Search Bar Skeleton */}
        <div className="h-12 w-full md:w-80 bg-foreground/10 rounded-full shrink-0" />
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-2 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 bg-foreground/10 rounded-full" />
        ))}
      </div>

      {/* Publications List / Grid */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-3xl border border-border/80 bg-foreground/2"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-20 bg-foreground/10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-foreground/10 rounded" />
                <div className="h-6 w-3/4 bg-foreground/10 rounded-lg" />
                <div className="h-3 w-40 bg-foreground/5 rounded" />
              </div>
            </div>
            <div className="h-8 w-24 bg-foreground/10 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
