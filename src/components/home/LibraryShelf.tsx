'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { BOOKS } from '@/components/sections/hardback/hardback-data';

// Dynamically load the 3D Book Card with client-only canvas
const Book3DCard = dynamic(
  () => import('./Book3DCard').then((mod) => mod.Book3DCard),
  {
    ssr: false,
    loading: () => (
      <div className="h-[470px] w-[300px] md:h-[520px] md:w-[330px] shrink-0 animate-pulse rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center border border-border/40">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Binding volume…
        </span>
      </div>
    ),
  }
);

export default function LibraryShelf() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);
  const [totalLibraryCount, setTotalLibraryCount] = useState<number>(62);
  const [totalPicksCount, setTotalPicksCount] = useState<number>(BOOKS.length);

  // Fetch dynamic library volume count and picks count
  useEffect(() => {
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

    fetch('/api/editors-shelf')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          setTotalPicksCount(data.items.length);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

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
    const measure = () => {
      if (!trackRef.current) return;
      const totalWidth = trackRef.current.scrollWidth;
      const viewportWidth = window.innerWidth;
      setMaxX(Math.max(0, totalWidth - viewportWidth));
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    if (trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }
    window.addEventListener('resize', measure);

    // Re-measure after initial canvas mounts
    const timer = setTimeout(measure, 500);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const libraryCountDisplay = totalLibraryCount ? `${totalLibraryCount}+` : '200+';

  return (
    <section
      ref={sectionRef}
      className="relative border-t border-border bg-background"
      style={{ height: maxX > 0 ? `calc(100vh + ${maxX}px)` : '220vh' }}
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
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/editors-shelf"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity duration-200 hover:opacity-85"
              >
                Editor’s Shelf
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/community/library"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors duration-200 hover:border-foreground"
              >
                Explore Library
              </Link>
            </div>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {totalLibraryCount} Books in Library · {totalPicksCount} Excelsior’s Picks
            </p>
          </div>

          {/* 5 Featured Books */}
          {BOOKS.slice(0, 5).map((book, i) => (
            <Book3DCard key={book.id} book={book} index={i} />
          ))}

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
      </div>
    </section>
  );
}
