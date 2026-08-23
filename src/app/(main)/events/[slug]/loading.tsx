export default function EventDetailLoading() {
  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-8 md:py-12 min-h-[calc(100vh-80px)] animate-pulse space-y-10">
      {/* Newspaper Headline Block Skeleton */}
      <div className="border-b-4 border-double border-border pb-8 text-center flex flex-col items-center space-y-4">
        <div className="h-4 w-40 bg-foreground/10 rounded-full" />
        <div className="h-16 md:h-24 w-4/5 max-w-4xl bg-foreground/10 rounded-3xl" />
        <div className="h-4 w-60 bg-foreground/5 rounded-full" />
      </div>

      {/* 2-Column Broadsheet & Ticket Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Broadsheet Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="aspect-video w-full rounded-2xl bg-foreground/10" />
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full bg-foreground/10 rounded" />
            <div className="h-4 w-full bg-foreground/10 rounded" />
            <div className="h-4 w-5/6 bg-foreground/10 rounded" />
          </div>
        </div>

        {/* Right Ticket Mockup Skeleton */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-border p-6 space-y-6 bg-foreground/2">
            <div className="h-6 w-36 bg-foreground/10 rounded" />
            <div className="space-y-3 pt-2">
              <div className="h-4 w-full bg-foreground/10 rounded" />
              <div className="h-4 w-full bg-foreground/10 rounded" />
              <div className="h-4 w-2/3 bg-foreground/10 rounded" />
            </div>
            <div className="h-12 w-full bg-foreground/10 rounded-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
