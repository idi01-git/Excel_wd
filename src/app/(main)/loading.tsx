export default function MainDefaultLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16 min-h-[calc(100vh-80px)] animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8 mb-12">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-foreground/10 rounded-full" />
          <div className="h-12 md:h-16 w-72 md:w-96 bg-foreground/10 rounded-2xl" />
        </div>
        <div className="h-10 w-48 bg-foreground/10 rounded-xl shrink-0" />
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-border/80 p-6 space-y-4 bg-foreground/2"
          >
            <div className="aspect-video w-full rounded-2xl bg-foreground/10" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-24 bg-foreground/10 rounded-full" />
              <div className="h-6 w-4/5 bg-foreground/10 rounded-xl" />
              <div className="h-4 w-full bg-foreground/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
