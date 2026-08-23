'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { FadeUp, RevealWords, EASE } from '@/components/home/primitives';
import { RevealButton } from '@/components/ui/RevealButton';
import { getOptimizedCardUrl } from '@/lib/image-optimization';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'COMPETITION' | 'PUBLICATION' | 'AWARD' | 'MILESTONE';
  date: string;
  image?: string | null;
}

const CATEGORY_FALLBACK: Record<Achievement['category'], string> = {
  AWARD: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1600&h=1000&fit=crop',
  COMPETITION: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1600&h=1000&fit=crop',
  PUBLICATION: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600&h=1000&fit=crop',
  MILESTONE: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&h=1000&fit=crop',
};

export default function AchievementsShowcase() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  // Progressive reveal: 5 rows initially, 5 more per "Load more" click.
  // The full archive count stays authoritative everywhere.
  const [displayLimit, setDisplayLimit] = useState(5);
  const reduce = useReducedMotion();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch('/api/community/achievements');
        const data = await res.json();
        if (data.success) setAchievements(data.achievements);
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const visible = achievements.slice(0, displayLimit);
  const hasMore = displayLimit < achievements.length;

  return (
    <div className="w-full bg-background font-sans">
      {/* ── HERO ── */}
      <div ref={heroRef} className="relative overflow-hidden px-6 pt-11 pb-10 md:px-10 md:pt-16 md:pb-14">
        {/* Ghost numeral */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[clamp(10rem,28vw,24rem)] font-medium leading-none tracking-[-0.05em] text-foreground/[0.06] dark:text-foreground/[0.14] md:-top-14"
        >
          {achievements.length > 0 ? String(achievements.length).padStart(2, '0') : '00'}
        </span>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative mx-auto max-w-7xl">
          <h1 className="font-display text-[clamp(2.6rem,7.5vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.03em] text-foreground">
            <RevealWords text="Proof, not" delay={0.1} />
            <br />
            <em className="font-normal italic">
              <RevealWords text="promises." delay={0.35} />
            </em>
          </h1>

          <FadeUp delay={0.4} className="mt-6 md:mt-8">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Every award, competition, publication and milestone the society has
              earned — kept on the record, kept in the archive.
            </p>
          </FadeUp>
        </motion.div>

        {/* Scroll progress hairline */}
        {!loading && achievements.length > 0 && (
          <AchievementProgress count={visible.length} />
        )}
      </div>

      {/* ── ENTRIES ── */}
      <div className="px-6 pb-20 pt-4 md:px-10 md:pb-28">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="space-y-16 py-12">
              {[0, 1].map((n) => (
                <div key={n} className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
                  <div className="animate-pulse rounded-2xl bg-foreground/[0.05] md:col-span-7 aspect-[16/10]" />
                  <div className="animate-pulse space-y-4 md:col-span-5">
                    <div className="h-4 w-16 rounded bg-foreground/[0.05]" />
                    <div className="h-10 w-4/5 rounded bg-foreground/[0.05]" />
                    <div className="h-3 w-full rounded bg-foreground/[0.05]" />
                    <div className="h-3 w-2/3 rounded bg-foreground/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length > 0 ? (
            <>
              <motion.div layout className="space-y-16 md:space-y-24">
                <AnimatePresence mode="popLayout">
                  {visible.map((ach, i) => (
                    <AchievementRow key={ach.id} ach={ach} index={i} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* ── LOAD MORE ── */}
              {hasMore ? (
                <div className="mt-16 md:mt-24 flex flex-col items-center justify-center">
                  <RevealButton
                    label="Load more"
                    onClick={() => setDisplayLimit((prev) => Math.min(prev + 5, achievements.length))}
                  />
                  <span className="mt-3 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                    {visible.length} / {achievements.length}
                  </span>
                </div>
              ) : (
                <div className="mt-16 md:mt-24 flex items-center justify-center gap-3 text-muted-foreground/60 font-mono text-[10px] uppercase tracking-[0.24em]">
                  <span className="h-px w-10 bg-border" />
                  <span>End of the record</span>
                  <span className="h-px w-10 bg-border" />
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="border border-dashed border-border py-24 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              {achievements.length === 0
                ? 'No achievements recorded yet.'
                : 'Nothing in this category — yet.'}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Scroll hairline under hero ── */
function AchievementProgress({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div ref={ref} className="absolute inset-0 -z-10">
      <motion.div
        style={{ scaleX, transformOrigin: '0% 50%' }}
        className="absolute bottom-0 left-0 h-px w-full bg-foreground/60"
      />
      <span className="sr-only">{count} achievements</span>
    </div>
  );
}

/* ── One cinematic editorial row ── */
function AchievementRow({ ach, index }: { ach: Achievement; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(imageBoxRef, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const flipped = index % 2 === 1;

  // Parallax on scroll
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ['start end', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : flipped ? [40, -40] : [-40, 40]);
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : flipped ? [-16, 16] : [16, -16]);

  // Cursor-tracking spring physics for Awwwards-level interactive feel
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const hov = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 220, damping: 28, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 220, damping: 28, mass: 0.5 });
  const sh = useSpring(hov, { stiffness: 200, damping: 26 });

  const rotX = useTransform(sy, [-0.5, 0.5], [5, -5]);
  const rotY = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const cardScale = useTransform(sh, [0, 1], [1, 1.02]);
  const imgZoom = useTransform(sh, [0, 1], [1, 1.07]);
  const shadowLift = useTransform(
    sh,
    [0, 1],
    [
      '0 4px 20px rgba(0,0,0,0.04)',
      '0 24px 50px -10px rgba(0,0,0,0.16)'
    ]
  );
  const overlayDim = useTransform(sh, [0, 1], [0, 0.096]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || !imageBoxRef.current) return;
    const r = imageBoxRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const rawSrc = ach.image || CATEGORY_FALLBACK[ach.category];
  const src = getOptimizedCardUrl(rawSrc, 1200);
  const num = String(index + 1).padStart(2, '0');
  const dateLabel = new Date(ach.date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  });

  return (
    <motion.article
      ref={rowRef}
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-12"
    >
      {/* Image Container with 3D Tilt & Smooth Zoom */}
      <div
        ref={imageBoxRef}
        onPointerMove={onPointerMove}
        onPointerEnter={() => hov.set(1)}
        onPointerLeave={() => {
          hov.set(0);
          mx.set(0);
          my.set(0);
        }}
        className={`group relative md:col-span-7 ${flipped ? 'md:order-2' : ''}`}
        style={{ perspective: 1200 }}
      >
        <motion.div
          initial={
            reduce
              ? undefined
              : {
                  clipPath: 'inset(45% 45% 45% 45% round 16px)',
                  opacity: 0,
                }
          }
          animate={
            reduce || isInView
              ? {
                  clipPath: 'inset(0% 0% 0% 0% round 16px)',
                  opacity: 1,
                }
              : {
                  clipPath: 'inset(45% 45% 45% 45% round 16px)',
                  opacity: 0,
                }
          }
          transition={{
            duration: 1.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            rotateX: reduce ? 0 : rotX,
            rotateY: reduce ? 0 : rotY,
            scale: reduce ? 1 : cardScale,
            boxShadow: shadowLift,
            transformStyle: 'preserve-3d',
          }}
          className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/80 bg-foreground/[0.02] cursor-pointer will-change-transform"
        >
          {/* Parallax & Zoom Image layer */}
          <motion.div
            style={{ y: imgY, scale: imgZoom, willChange: 'transform' }}
            className="absolute inset-[-12%]"
          >
            <img
              src={src}
              alt={ach.title}
              loading="lazy"
              className="h-full w-full object-cover select-none transform-gpu"
            />
          </motion.div>

          {/* Smooth Darkening on Hover */}
          <motion.div
            style={{ opacity: overlayDim }}
            className="absolute inset-0 bg-black pointer-events-none"
          />

          {/* Ghost numeral over image */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-4 right-6 select-none font-display text-[clamp(4rem,9vw,8rem)] font-medium leading-none tracking-[-0.04em] text-white/40 dark:text-white/50 mix-blend-overlay transition-transform duration-500 group-hover:scale-105 group-hover:text-white/60"
          >
            {num}
          </span>

          {/* Category Pill with micro glow */}
          <span className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/20 bg-black/40 px-3.5 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white backdrop-blur-md transition-all duration-300 group-hover:bg-black/60 group-hover:border-white/35 shadow-sm">
            {ach.category}
          </span>
        </motion.div>
      </div>

      {/* Details */}
      <motion.div
        style={{ y: textY }}
        className={`relative md:col-span-5 ${flipped ? 'md:order-1 md:text-right' : ''}`}
      >
        <FadeUp>
          <div className={`flex items-center gap-4 ${flipped ? 'md:justify-end' : ''}`}>
            <span className="font-mono text-[11px] font-medium tracking-[0.2em] text-foreground/70 dark:text-foreground/80">
              № {num}
            </span>
            <span className="h-px w-10 bg-foreground/30" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {dateLabel}
            </span>
          </div>
        </FadeUp>

        <h2 className="mt-6 font-display text-[clamp(1.8rem,3.6vw,3.1rem)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
          <RevealWords text={ach.title} stagger={0.035} />
        </h2>

        <FadeUp delay={0.15}>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground md:inline-block">
            {ach.description}
          </p>
        </FadeUp>
      </motion.div>
    </motion.article>
  );
}
