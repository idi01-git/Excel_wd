'use client';

import { useEffect, useRef, useState, useMemo, createRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { BOOKS, BookData } from '@/components/sections/hardback/hardback-data';
import { onCardwallSettled } from '@/lib/cardwall-events';

// One shared WebGL context renders every mounted book through DOM-tracked
// views (see ShelfBooksCanvas). The chunk is warmed by the HomePreloader
// before the hero runs; footprint is held either way (no layout shift).
const ShelfBooksCanvas = dynamic(() => import('./ShelfBooksCanvas'), { ssr: false });

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
  // WebGL books mount one at a time (behind identical-footprint spacers):
  // mounting all 5 in a single frame compiles 5 sets of shaders at once and
  // causes a visible scroll hitch. Books appear progressively, with zero
  // layout shift and zero mid-hero-flight shader compilation.
  const [mountedBooks, setMountedBooks] = useState(0);
  // WebGL render loops are parked whenever the shelf is off-screen.
  const [shelfActive, setShelfActive] = useState(false);
  // Which book slot is hovered (drives the 3D pose + contact shadow).
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Stable per-slot ref objects shared by the DOM slots and the 3D views,
  // rebuilt only when the featured list itself changes.
  const slotRefs = useMemo(() => {
    const map = new Map<string, React.RefObject<HTMLDivElement | null>>();
    featuredBooks.forEach((book, i) => map.set(book.id || `feat-${i}`, createRef<HTMLDivElement>()));
    return map;
  }, [featuredBooks]);
  const getSlotRef = (key: string) => slotRefs.get(key);

  // Progressive mounting: one book every ~150ms until all 5 are up.
  useEffect(() => {
    if (mountedBooks <= 0 || mountedBooks >= featuredBooks.length) return;
    const timer = setTimeout(() => setMountedBooks((m) => m + 1), 150);
    return () => clearTimeout(timer);
  }, [mountedBooks, featuredBooks.length]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let ready = false;
    const activate = () => {
      if (ready) return;
      ready = true;
      setMountedBooks(1);
    };

    const mountObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          activate();
          mountObserver.disconnect();
        }
      },
      { rootMargin: '150% 0px 150% 0px' }
    );
    mountObserver.observe(section);

    const unsubscribeSettled = onCardwallSettled(activate);
    const fallbackTimer = setTimeout(activate, 7000);

    const activeObserver = new IntersectionObserver(
      ([entry]) => setShelfActive(entry.isIntersecting),
      { rootMargin: '25% 0px 25% 0px' }
    );
    activeObserver.observe(section);

    return () => {
      mountObserver.disconnect();
      activeObserver.disconnect();
      unsubscribeSettled();
      clearTimeout(fallbackTimer);
    };
  }, []);

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
          className="relative z-0 flex w-max items-center gap-8 pl-6 pr-6 will-change-transform md:gap-12 md:pl-12 md:pr-10"
        >
          {/* Intro panel */}
          <div className="w-[85vw] shrink-0 sm:w-[65vw] md:w-[44vw] lg:w-[36vw] flex flex-col justify-center pr-4">
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
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent pointer-events-none" />
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
                  className="group relative inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/50 backdrop-blur-xs px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors duration-200 hover:border-foreground/60 hover:bg-foreground/[0.04]"
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
              slots hold layout; WebGL volumes mount progressively into the shared
              canvas so shader compilation never stutters the scroll */}
          {featuredBooks.map((book, i) =>
            i < mountedBooks ? (
              <div
                key={book.id || `feat-${i}`}
                ref={(el) => {
                  const slot = getSlotRef(book.id || `feat-${i}`);
                  if (slot) slot.current = el;
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx((prev) => (prev === i ? null : prev))}
                className="group relative block h-[470px] w-[300px] shrink-0 md:h-[520px] md:w-[330px] select-none"
              >
                {/* Soft, rich ambient contact drop shadow */}
                <div
                  aria-hidden
                  className={`absolute -bottom-5 left-1/2 h-8 w-[72%] -translate-x-1/2 rounded-[100%] bg-black/45 blur-xl transition-all duration-700 ease-out ${
                    hoveredIdx === i ? 'scale-110 opacity-70 blur-2xl' : 'scale-95 opacity-35'
                  }`}
                />

                <Link
                  href="/editors-shelf"
                  className="absolute inset-0 z-[1] block w-full h-full cursor-pointer"
                  aria-label={`${book.title} by ${book.author} — view 3D volume`}
                />
              </div>
            ) : (
              <div
                key={book.id || `feat-${i}`}
                aria-hidden
                className="h-[470px] w-[300px] md:h-[520px] md:w-[330px] shrink-0"
              />
            )
          )}

          {/* Outro (Circular Arrow Button connecting to Library) */}
          <div className="flex w-[14vw] min-w-[100px] max-w-[160px] shrink-0 items-center justify-center pl-2 pr-4">
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

        {/* Shared WebGL layer — one context renders every mounted book, scissored
            to its slot. Sits above the track so books occlude their contact
            shadows exactly like the previous per-book canvases did; transparent
            and pointer-inert everywhere else. */}
        <ShelfBooksCanvas
          slots={featuredBooks
            .slice(0, mountedBooks)
            .flatMap((book, i) => {
              const trackRef = getSlotRef(book.id || `feat-${i}`);
              return trackRef
                ? [{ book, index: i, trackRef, hovered: hoveredIdx === i }]
                : [];
            })}
          paused={!shelfActive}
        />
      </div>
    </section>
  );
}
