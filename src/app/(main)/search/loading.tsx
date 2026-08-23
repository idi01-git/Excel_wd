export default function SearchLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 min-h-[calc(100vh-80px)] animate-pulse space-y-10">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="h-4 w-32 bg-foreground/10 rounded-full mx-auto" />
        <div className="h-12 md:h-16 w-3/4 max-w-lg bg-foreground/10 rounded-2xl mx-auto" />
      </div>

      {/* Search Input Skeleton */}
      <div className="h-14 w-full bg-foreground/10 rounded-2xl" />

      {/* Result Cards */}
      <div className="space-y-4 pt-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-border bg-foreground/2 space-y-3"
          >
            <div className="h-4 w-24 bg-foreground/10 rounded-full" />
            <div className="h-6 w-3/4 bg-foreground/10 rounded-lg" />
            <div className="h-4 w-full bg-foreground/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
