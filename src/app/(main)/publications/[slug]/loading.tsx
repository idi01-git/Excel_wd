export default function PublicationDetailLoading() {
  return (
    <article className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 min-h-[calc(100vh-80px)] animate-pulse space-y-10">
      {/* Category & Reading Time */}
      <div className="flex items-center gap-3">
        <div className="h-4 w-24 bg-foreground/10 rounded-full" />
        <div className="h-4 w-4 bg-foreground/10 rounded-full" />
        <div className="h-4 w-20 bg-foreground/10 rounded-full" />
      </div>

      {/* Main Title */}
      <div className="space-y-3">
        <div className="h-10 md:h-14 w-full bg-foreground/10 rounded-2xl" />
        <div className="h-10 md:h-14 w-2/3 bg-foreground/10 rounded-2xl" />
      </div>

      {/* Author Byline Lockup */}
      <div className="flex items-center justify-between py-6 border-y border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-foreground/10" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-foreground/10 rounded" />
            <div className="h-3 w-24 bg-foreground/5 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-foreground/10" />
          <div className="w-9 h-9 rounded-full bg-foreground/10" />
        </div>
      </div>

      {/* Hero Cover Image */}
      <div className="aspect-video w-full rounded-3xl bg-foreground/10" />

      {/* Article Body Paragraphs */}
      <div className="space-y-4 pt-4">
        <div className="h-4 w-full bg-foreground/10 rounded" />
        <div className="h-4 w-full bg-foreground/10 rounded" />
        <div className="h-4 w-5/6 bg-foreground/10 rounded" />
        <div className="h-4 w-full bg-foreground/10 rounded" />
        <div className="h-4 w-4/5 bg-foreground/10 rounded" />
      </div>
    </article>
  );
}
