export default function EventsLoading() {
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

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-border/80 p-6 space-y-4 bg-foreground/2 flex flex-col justify-between"
          >
            <div className="aspect-video w-full rounded-2xl bg-foreground/10" />
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-foreground/10 rounded-full" />
                <div className="h-4 w-16 bg-foreground/10 rounded-full" />
              </div>
              <div className="h-7 w-4/5 bg-foreground/10 rounded-xl" />
              <div className="h-4 w-full bg-foreground/5 rounded" />
            </div>
            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
              <div className="h-4 w-28 bg-foreground/10 rounded" />
              <div className="h-8 w-24 bg-foreground/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
