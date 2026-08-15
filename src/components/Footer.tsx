import Link from 'next/link';

const MARQUEE_ITEMS = [
  'Stories',
  'Poetry',
  'Essays',
  'Discourse',
  'Critique',
  'Fiction',
  'Slams',
  'Anthology',
];

const EXPLORE_LINKS = [
  { label: 'Publications', href: '/publications' },
  { label: "Editor's Shelf", href: '/editors-shelf' },
  { label: 'Events', href: '/events' },
  { label: 'Search', href: '/search' },
];

const COMMUNITY_LINKS = [
  { label: 'Members', href: '/community/members' },
  { label: 'Library', href: '/community/library' },
  { label: 'Gallery', href: '/community/gallery' },
  { label: 'Alumni', href: '/community/alumni' },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto bg-foreground text-background">
      {/* Marquee */}
      <div className="overflow-hidden border-b border-background/15 py-4">
        <div className="animate-marquee flex w-max items-center whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex items-center font-mono text-[11px] uppercase tracking-[0.32em] text-background/50"
            >
              {MARQUEE_ITEMS.map((item) => (
                <span key={`${copy}-${item}`} className="flex items-center">
                  <span className="px-6">{item}</span>
                  <span className="text-background/30">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16 md:px-10 md:pt-24">
        {/* Giant wordmark */}
        <Link
          href="/"
          className="block font-display text-[clamp(3.8rem,13vw,11rem)] font-medium leading-[0.9] tracking-[-0.04em] text-background transition-opacity duration-300 hover:opacity-80"
        >
          Excelsior<span className="italic">.</span>
        </Link>

        {/* Grid */}
        <div className="mt-14 grid grid-cols-1 gap-10 border-t border-background/15 pt-10 md:mt-20 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p className="max-w-sm text-sm leading-relaxed text-background/60">
              Constructing stories, preserving poetry, and building community —
              a sanctuary for campus writers and journalists since 2015.
            </p>
            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-background/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-all duration-300 hover:bg-background hover:text-foreground"
            >
              Join the society →
            </Link>
          </div>

          <nav className="md:col-span-3 md:col-start-7" aria-label="Explore">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.28em] text-background/40">
              Explore
            </h4>
            <ul className="mt-5 space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors duration-200 hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-3" aria-label="Community">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.28em] text-background/40">
              Community
            </h4>
            <ul className="mt-5 space-y-3">
              {COMMUNITY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors duration-200 hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-3 border-t border-background/15 pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-background/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Excelsior Literary Society</span>
          <span>Est. 2015 · Still in print</span>
        </div>
      </div>
    </footer>
  );
}
