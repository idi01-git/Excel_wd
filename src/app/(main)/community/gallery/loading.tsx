export default function GalleryLoading() {
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

      {/* Masonry / Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className={`w-full rounded-2xl border border-border bg-foreground/5 p-2 ${
              i % 2 === 0 ? 'aspect-3/4' : 'aspect-4/3'
            }`}
          >
            <div className="w-full h-full rounded-xl bg-foreground/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
