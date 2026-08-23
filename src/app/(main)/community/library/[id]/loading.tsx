export default function BookDetailLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16 min-h-[calc(100vh-80px)] animate-pulse space-y-16">
      {/* 2-Column Book Pedestal & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Cover Pedestal */}
        <div className="lg:col-span-5 w-full">
          <div className="w-full aspect-4/5 bg-foreground/5 rounded-3xl flex items-center justify-center p-8 border border-border">
            <div className="aspect-2/3 max-w-60 w-full rounded-xl bg-foreground/10" />
          </div>
        </div>

        {/* Right Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-foreground/10 rounded-full" />
            <div className="h-10 md:h-14 w-4/5 bg-foreground/10 rounded-2xl" />
            <div className="h-4 w-40 bg-foreground/5 rounded" />
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="h-4 w-full bg-foreground/10 rounded" />
            <div className="h-4 w-full bg-foreground/10 rounded" />
            <div className="h-4 w-3/4 bg-foreground/10 rounded" />
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <div className="h-12 w-44 bg-foreground/10 rounded-full" />
            <div className="h-12 w-36 bg-foreground/5 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
