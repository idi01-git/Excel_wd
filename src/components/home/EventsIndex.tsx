'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'motion/react';
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

export default function EventsIndex() {
  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 140, damping: 18, mass: 0.4 });
  const py = useSpring(my, { stiffness: 140, damping: 18, mass: 0.4 });

  const handleMove = (e: React.MouseEvent) => {
    const rect = listRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  };

  return (
    <section className="relative w-full border-t border-border bg-background px-6 pt-20 pb-24 md:px-10 md:pt-28 md:pb-32">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <FadeUp>
              <Eyebrow>Occasions · 2015 — present</Eyebrow>
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
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
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
            style={{ x: px, y: py }}
            className="pointer-events-none absolute left-0 top-0 z-20 hidden lg:block"
            aria-hidden
          >
            <motion.div
              animate={{
                opacity: active !== null ? 1 : 0,
                scale: active !== null ? 1 : 0.85,
                rotate: active !== null ? -4 : 0,
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative -ml-[130px] -mt-[190px] h-[380px] w-[260px] overflow-hidden rounded-2xl shadow-2xl shadow-black/30"
            >
              {EVENTS.map((event, i) => (
                <img
                  key={event.index}
                  src={event.image}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                    active === i ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
            </motion.div>
          </motion.div>

          <div className="border-t border-border">
            {EVENTS.map((event, i) => (
              <FadeUp key={event.index} delay={i * 0.05} y={20}>
                <Link
                  href="/events"
                  onMouseEnter={() => setActive(i)}
                  className="group relative grid grid-cols-[3rem_1fr_auto] items-center gap-x-4 border-b border-border py-6 transition-colors duration-300 hover:bg-foreground/[0.03] md:grid-cols-[5rem_1fr_auto] md:gap-x-8 md:py-8"
                >
                  <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                    /{event.index}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-medium leading-tight tracking-[-0.02em] text-foreground transition-transform duration-500 ease-out group-hover:translate-x-3 sm:text-3xl md:text-5xl">
                      {event.title}
                    </h3>
                    {/* Mobile thumbnail */}
                    <div className="mt-3 overflow-hidden rounded-lg md:hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        loading="lazy"
                        className="aspect-[16/9] w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right">
                    <div className="hidden font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground sm:block">
                      <div>{event.kind}</div>
                      <div>
                        {event.date} · {event.venue}
                      </div>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-all duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background md:h-12 md:w-12">
                      <ArrowUpRight
                        size={16}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.1}>
            <div className="flex items-center justify-between pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>Archive · 40+ editions</span>
              <span className="hidden sm:block">Hover to preview</span>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
