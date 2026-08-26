'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Eyebrow, RevealWords, FadeUp } from './primitives';

const EVENTS = [
  {
    index: '01',
    title: 'The Monsoon Slams',
    kind: 'Poetry Slam',
    date: 'Aug 2025',
    venue: 'Amphitheatre',
    image:
      'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=900&h=1200&fit=crop',
  },
  {
    index: '02',
    title: 'Midnight Manuscripts',
    kind: 'Workshop Marathon',
    date: 'Mar 2025',
    venue: 'Reading Room 2B',
    image:
      'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=900&h=1200&fit=crop',
  },
  {
    index: '03',
    title: 'Ink & Ivy Homecoming',
    kind: 'Alumni Panel',
    date: 'Dec 2024',
    venue: 'Great Hall',
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=1200&fit=crop',
  },
  {
    index: '04',
    title: 'The Borgès Symposium',
    kind: 'Lecture Series',
    date: 'Sep 2024',
    venue: 'Old Library',
    image:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&h=1200&fit=crop',
  },
  {
    index: '05',
    title: 'Letters to a Younger Self',
    kind: 'Anthology Launch',
    date: 'May 2024',
    venue: 'Courtyard',
    image:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=900&h=1200&fit=crop',
  },
];

type HomeEvent = (typeof EVENTS)[number] & { href?: string };

export default function EventsIndex({ initialEvents }: { initialEvents?: HomeEvent[] }) {
  const [events, setEvents] = useState<HomeEvent[]>(initialEvents || []);
  const [hasLoaded, setHasLoaded] = useState(initialEvents !== undefined);

  useEffect(() => {
    if (initialEvents !== undefined) return;
    void fetch('/api/site-settings')
      .then((response) => response.json())
      .then((data) => {
        const items = data.settings?.['home.eventsStrip']?.items;
        if (Array.isArray(items) && items.length) {
          setEvents(
            items.slice(0, 8).map((item: any, index: number) => ({
              index: String(index + 1).padStart(2, '0'),
              title: item.title,
              kind: item.kind,
              date: item.date,
              venue: item.venue,
              image: item.image,
              href: item.href || '/events',
            }))
          );
        } else {
          setEvents([]);
        }
      })
      .catch(() => {
        setEvents([]);
      })
      .finally(() => {
        setHasLoaded(true);
      });
  }, [initialEvents]);

  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  // Mouse physics with velocity-driven tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 220, damping: 28, mass: 0.5 });
  const py = useSpring(my, { stiffness: 220, damping: 28, mass: 0.5 });

  // Subtle dynamic rotation tilt based on cursor position
  const rotateSpring = useTransform(px, [0, 1000], [-6, 6]);
  const smoothRotate = useSpring(rotateSpring, { stiffness: 200, damping: 24 });

  const handleMove = (e: React.MouseEvent) => {
    const rect = listRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  };

  // If there are no events to display, do not render the section on the homepage
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-background px-6 pt-10 pb-20 md:px-10 md:pt-14 md:pb-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <FadeUp>
              <Eyebrow>Occasions · 2014 — present</Eyebrow>
            </FadeUp>
            <h2 className="mt-5 font-display text-[clamp(2.8rem,7.5vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.03em] text-foreground">
              <RevealWords text="Nights we" />
              <br />
              <em className="font-normal italic">
                <RevealWords text="hosted." delay={0.12} />
              </em>
            </h2>
          </div>
          <div className="md:col-span-4 md:pb-2">
            <FadeUp delay={0.15}>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Slams, symposiums, workshops and launches — every season the
                society convenes to argue, read, and applaud. A ledger of our
                recent gatherings.
              </p>
              <Link
                href="/events"
                className="group mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground transition-colors hover:text-muted-foreground"
              >
                Full programme
                <ArrowUpRight
                  size={14}
                  className="transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </FadeUp>
          </div>
        </div>

        {/* Index list */}
        <div
          ref={listRef}
          onMouseMove={handleMove}
          onMouseLeave={() => setActive(null)}
          className="relative"
        >
          {/* Floating preview (desktop, fine pointer only) */}
          <motion.div
            style={{ x: px, y: py, rotate: smoothRotate }}
            className="pointer-events-none absolute left-0 top-0 z-30 hidden lg:block will-change-transform"
            aria-hidden
          >
            <AnimatePresence>
              {active !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: 15 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 25, mass: 0.6 }}
                  className="relative -ml-[130px] -mt-[190px] h-[380px] w-[260px] overflow-hidden rounded-2xl shadow-2xl shadow-black/40 border border-white/15"
                >
                  {events.map((event, i) => (
                    <motion.img
                      key={event.index}
                      src={event.image}
                      alt=""
                      animate={{
                        opacity: active === i ? 1 : 0,
                        scale: active === i ? 1 : 1.06,
                      }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ))}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* List items */}
          <div className="relative border-t border-border">
            {events.map((event, i) => {
              const isHovered = active === i;

              return (
                <FadeUp key={event.index} delay={i * 0.04} y={15}>
                  <Link
                    href="/events"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => {
                      if (active === i) setActive(null);
                    }}
                    className="group relative block outline-none"
                  >
                    <motion.div
                      animate={{
                        backgroundColor: isHovered
                          ? 'rgba(var(--foreground), 0.03)'
                          : 'rgba(var(--foreground), 0)',
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="relative flex items-center justify-between gap-x-4 border-b border-border py-5 md:py-8 transition-colors"
                    >
                      {/* Title */}
                      <div className="min-w-0 flex-1">
                        <motion.h3
                          animate={{
                            x: isHovered ? 14 : 0,
                          }}
                          transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }}
                          className="font-display text-2xl font-medium leading-tight tracking-[-0.02em] text-foreground sm:text-3xl md:text-5xl"
                        >
                          {event.title}
                        </motion.h3>
                      </div>

                      {/* Category & Interactive Action Circle */}
                      <div className="flex items-center gap-5 text-right">
                        <div className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
                          <motion.span
                            animate={{
                              color: isHovered ? 'var(--foreground)' : 'var(--muted-foreground)',
                              x: isHovered ? -3 : 0,
                            }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="inline-block"
                          >
                            {event.kind}
                          </motion.span>
                        </div>

                        {/* Interactive Circle with Smooth Spring Animation */}
                        <motion.span
                          animate={{
                            scale: isHovered ? 1.12 : 1.0,
                            backgroundColor: isHovered
                              ? 'var(--foreground)'
                              : 'transparent',
                            color: isHovered
                              ? 'var(--background)'
                              : 'var(--foreground)',
                            borderColor: isHovered
                              ? 'var(--foreground)'
                              : 'var(--border)',
                          }}
                          transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border md:h-12 md:w-12 shadow-sm"
                        >
                          <motion.div
                            animate={{
                              rotate: isHovered ? 45 : 0,
                              scale: isHovered ? 1.1 : 1.0,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="flex items-center justify-center pointer-events-none"
                          >
                            <ArrowUpRight size={16} strokeWidth={1.75} />
                          </motion.div>
                        </motion.span>
                      </div>
                    </motion.div>
                  </Link>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
