'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { BOOKS, BookData } from '@/components/sections/hardback/hardback-data';

// Dynamically load the 3D Book Card with client-only canvas.
// The chunk is warmed by the HomePreloader before the hero runs, so this
// boundary almost never shows; footprint is held either way (no layout shift).
const Book3DCard = dynamic(
  () => import('./Book3DCard').then((mod) => mod.Book3DCard),
  {
    ssr: false,
    loading: () => (
      <div className="h-117.5 w-75 md:h-130 md:w-82.5 shrink-0" aria-hidden />
    ),
  }
);

const DEFAULT_SHELF_SCROLL = 1450;

export default function LibraryShelf({
  initialBooks,
  initialLibraryCount,
}: {
  initialBooks?: BookData[];
  initialLibraryCount?: number;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState<number>(DEFAULT_SHELF_SCROLL);
  const [totalLibraryCount, setTotalLibraryCount] = useState<number>(initialLibraryCount ?? 62);
  const [totalPicksCount, setTotalPicksCount] = useState<number>(initialBooks ? initialBooks.length : BOOKS.length);
  const [featuredBooks, setFeaturedBooks] = useState<BookData[]>(() =>
    initialBooks && initialBooks.length > 0 ? initialBooks.slice(0, 5) : BOOKS.slice(0, 5)
  );
  // Cards mount during the page loader, concealed by its overlay. This moves
  // shader setup off the visitor's scroll path, so the shelf never opens empty.
  const [mountedBooks, setMountedBooks] = useState(featuredBooks.length);
  // WebGL render loops are parked whenever the shelf is off-screen.
  const [shelfActive, setShelfActive] = useState(false);


  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let ready = false;
    const activate = () => {
      if (ready) return;
      ready = true;
      setMountedBooks(featuredBooks.length);
    };

    const mountObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          activate();
          mountObserver.disconnect();
        }
      },
      { rootMargin: '50% 0px 50% 0px' }
    );
    mountObserver.observe(section);

    // Lenis can cross a section between IntersectionObserver sampling frames
    // during a fast scroll. Ensure the first card always mounts shortly after
    // hydration so the layout never remains as empty footprint placeholders.
    const fallbackMountTimer = window.setTimeout(activate, 250);

    const activeObserver = new IntersectionObserver(
      ([entry]) => setShelfActive(entry.isIntersecting),
      { rootMargin: '25% 0px 25% 0px' }
    );
    activeObserver.observe(section);

    return () => {
      window.clearTimeout(fallbackMountTimer);
      mountObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [featuredBooks.length]);

  // Fetch dynamic library volume count and picks count only if not provided by server
  useEffect(() => {
    if (initialBooks && initialBooks.length > 0 && initialLibraryCount !== undefined) return;
    let isMounted = true;
    fetch('/api/library?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && typeof data.pagination?.total === 'number') {
          setTotalLibraryCount(data.pagination.total);
        } else if (data.success && typeof data.total === 'number') {
          setTotalLibraryCount(data.total);
        }
      })
      .catch(() => {});

    if (!initialBooks || initialBooks.length === 0) {
      fetch('/api/editors-shelf')
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data.success && Array.isArray(data.items) && data.items.length > 0) {
            setTotalPicksCount(data.items.length);
            setFeaturedBooks(data.items.slice(0, 5));
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [initialBooks, initialLibraryCount]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 42,
    mass: 0.45,
  });

  const x = useTransform(smooth, [0, 1], [0, -maxX]);
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    let rafId: number;

    const measure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!trackRef.current) return;
        const totalWidth = trackRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        const newMax = Math.max(0, totalWidth - viewportWidth);
        setMaxX(newMax);
      });
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    if (trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const libraryCountDisplay = totalLibraryCount ? `${totalLibraryCount}+` : '200+';

  return (
    <section
      ref={sectionRef}
      suppressHydrationWarning
      className="relative border-t border-border bg-background"
      style={{ height: `calc(100vh + ${maxX}px)` }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {/* Ambient background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 60%, color-mix(in oklab, var(--foreground) 6%, transparent) 0%, transparent 70%)',
          }}
        />

        {/* Horizontal scroll track */}
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max items-center gap-8 pl-6 pr-6 will-change-transform md:gap-12 md:pl-12 md:pr-10"
        >
          {/* Intro panel */}
          <div className="mt-[12vh] w-[85vw] shrink-0 self-start sm:w-[65vw] md:mt-0 md:w-[44vw] md:self-auto lg:w-[36vw] flex flex-col justify-center pr-4">
            <h2 className="font-display text-[clamp(2.6rem,5.5vw,5rem)] font-medium leading-[0.95] tracking-[-0.03em] text-foreground">
              The society
              <br />
              <em className="font-normal italic">library.</em>
            </h2>
            <p className="mt-6 max-w-md text-sm md:text-base leading-relaxed text-muted-foreground">
              A curated collection of verse, criticism, and enduring strategy.
              Explore the clothbound volumes on the Editor’s Shelf, check a
              spine’s whereabouts, or request a borrow from the physical library.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <motion.div
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Link
                  href="/editors-shelf"
                  className="group relative inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-linear-to-r from-transparent via-white/20 dark:via-black/20 to-transparent pointer-events-none" />
                  <span className="relative z-10">Editor’s Shelf</span>
                  <ArrowRight
                    size={13}
                    className="relative z-10 transition-transform duration-300 ease-out group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Link
                  href="/community/library"
                  className="group relative inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/50 backdrop-blur-xs px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors duration-200 hover:border-foreground/60 hover:bg-foreground/4"
                >
                  <span>Explore Library</span>
                  <ArrowRight
                    size={13}
                    className="opacity-60 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
            </div>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {totalLibraryCount} Books in Library · {totalPicksCount} Excelsior’s Picks
            </p>
          </div>

          {/* 5 Featured Books (Dynamic Top 5 from Editor's Shelf) — plain footprint
              spacers hold layout; WebGL volumes mount progressively so shader
              compilation never stutters the scroll */}
          {featuredBooks.map((book, i) =>
            i < mountedBooks ? (
              <Book3DCard key={book.id || `feat-${i}`} book={book} index={i} paused={!shelfActive} />
            ) : (
              <div
                key={book.id || `feat-${i}`}
                aria-hidden
                className="h-117.5 w-75 md:h-130 md:w-82.5 shrink-0"
              />
            )
          )}

          {/* Outro (Circular Arrow Button connecting to Library) */}
          <div className="flex w-[14vw] min-w-25 max-w-40 shrink-0 items-center justify-center pl-2 pr-4">
            <Link
              href="/community/library"
              className="relative block outline-none"
              aria-label="Explore more in library"
            >
              <motion.div
                initial="rest"
                whileHover="hover"
                animate="rest"
                variants={{
                  rest: { scale: 1 },
                  hover: { scale: 1.1 },
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="group relative flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-border bg-background/90 text-foreground transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background shadow-sm hover:shadow-md cursor-pointer overflow-hidden"
              >
                <motion.div
                  variants={{
                    rest: { rotate: 0, scale: 1, x: 0, y: 0 },
                    hover: { rotate: -45, scale: 1.15, x: 1, y: -1 },
                  }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className="flex items-center justify-center pointer-events-none"
                >
                  <ArrowRight size={30} strokeWidth={1.8} />
                </motion.div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
