export default function EditorsShelfLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16 min-h-[calc(100vh-80px)] animate-pulse space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="space-y-3">
          <div className="h-4 w-28 bg-foreground/10 rounded-full" />
          <div className="h-14 md:h-20 w-80 md:w-110 bg-foreground/10 rounded-2xl" />
        </div>
        <div className="h-10 w-44 bg-foreground/10 rounded-xl shrink-0" />
      </div>

      {/* Featured Shelf Pick Skeleton */}
      <div className="rounded-3xl border border-border p-8 bg-foreground/2 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-48 aspect-2/3 rounded-xl bg-foreground/10 shrink-0" />
        <div className="space-y-4 flex-1">
          <div className="h-4 w-28 bg-foreground/10 rounded-full" />
          <div className="h-8 md:h-12 w-3/4 bg-foreground/10 rounded-xl" />
          <div className="h-4 w-full bg-foreground/5 rounded" />
          <div className="h-4 w-5/6 bg-foreground/5 rounded" />
        </div>
      </div>

      {/* Archive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-2/3 w-full rounded-xl bg-foreground/10" />
            <div className="space-y-1">
              <div className="h-4 w-4/5 bg-foreground/10 rounded" />
              <div className="h-3 w-1/2 bg-foreground/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
