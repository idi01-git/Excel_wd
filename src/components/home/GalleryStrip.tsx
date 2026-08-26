'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Eyebrow, FadeUp, RevealWords, EASE } from './primitives';
import { restoreChromeFromModal, yieldChromeToModal } from '@/lib/cardwall-events';
import { getOptimizedGalleryUrl, getOptimizedThumbnailUrl } from '@/lib/image-optimization';

export interface GalleryItem {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'POSTER' | 'MEMORY';
  url: string;
  caption?: string | null;
  createdAt: string;
}

const TYPE_LABEL: Record<GalleryItem['type'], string> = {
  PHOTO: 'Photo',
  VIDEO: 'Film',
  POSTER: 'Poster',
  MEMORY: 'Memory',
};

// ─── Curated 6 High-Diversity Gallery Items (From Gallery Page) ───────────
const HOME_CURATED_GALLERY: GalleryItem[] = [
  {
    id: 'sample-portrait-1',
    type: 'PHOTO',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    caption: 'Elena Vance — Literary Critique Fellow 2026',
    createdAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'sample-2',
    type: 'POSTER',
    url: 'https://images.unsplash.com/photo-1507842229451-7f01be8f1a1d?auto=format&fit=crop&w=1200&q=80',
    caption: 'Grand Archival Chamber — Annual Symposium 2026',
    createdAt: '2026-02-18T14:30:00Z',
  },
  {
    id: 'sample-portrait-3',
    type: 'MEMORY',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    caption: 'Clara Delacroix — Poetry reading during the Equinox Salon',
    createdAt: '2026-02-28T19:30:00Z',
  },
  {
    id: 'sample-7',
    type: 'MEMORY',
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1000&q=80',
    caption: 'Open novel with reading spectacles and margin notations',
    createdAt: '2025-11-28T15:10:00Z',
  },
  {
    id: 'sample-portrait-4',
    type: 'PHOTO',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    caption: 'Alexander Rhys — Archival curator and essayist',
    createdAt: '2026-02-22T16:15:00Z',
  },
  {
    id: 'sample-9',
    type: 'POSTER',
    url: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=1000&q=80',
    caption: 'Vaulted gothic cloister where evening debate rounds took place',
    createdAt: '2025-11-15T17:30:00Z',
  },
];

// ─── Archive Action Button (Identical Animation to Events Strip) ───────────
function ArchiveActionButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href="/community/gallery"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group inline-flex items-center gap-4 text-right cursor-pointer"
    >
      <div className="hidden font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
        <motion.span
          animate={{
            color: isHovered ? 'var(--foreground)' : 'var(--muted-foreground)',
            x: isHovered ? -3 : 0,
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="inline-block"
        >
          Enter the archive
        </motion.span>
      </div>

      {/* Interactive Circle with Smooth Spring Animation from Events Strip */}
      <motion.span
        animate={{
          scale: isHovered ? 1.12 : 1.0,
          backgroundColor: isHovered ? 'var(--foreground)' : 'transparent',
          color: isHovered ? 'var(--background)' : 'var(--foreground)',
          borderColor: isHovered ? 'var(--foreground)' : 'var(--border)',
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
    </Link>
  );
}

export default function GalleryStrip() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(6);
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/community/gallery?featured=true');
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && isMounted) {
          setItems(data.items);
        }
      } catch (error) {
        console.error('Failed to load featured gallery for landing page:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  const visible = items.slice(0, displayLimit);
  const hasMore = displayLimit < items.length;

  const activeIndex = items.findIndex((i) => i.id === activeId);
  const active = activeIndex >= 0 ? items[activeIndex] : null;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (activeIndex < 0 || items.length === 0) return;
      const next = (activeIndex + dir + items.length) % items.length;
      setActiveId(items[next].id);
    },
    [activeIndex, items]
  );

  // If loading has completed and there are no featured gallery items, omit the section
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-background px-6 pt-12 pb-24 md:px-10 md:pt-16 md:pb-32 font-sans overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
          <div>
            <FadeUp>
              <Eyebrow>Fragments · The Archive</Eyebrow>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.03em] text-foreground">
                Moments, <em className="font-normal italic">kept.</em>
              </h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.15}>
            <ArchiveActionButton />
          </FadeUp>
        </div>

        {/* ── PHOTO WALL MASONRY (ACCOMMODATES ALL RESOLUTIONS SEAMLESSLY) ── */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 sm:gap-6 md:gap-8 [&>*]:mb-5 sm:[&>*]:mb-6 md:[&>*]:mb-8">
          {visible.map((item, i) => (
            <GalleryTile
              key={item.id}
              item={item}
              index={i}
              reduce={!!reduce}
              onOpen={() => setActiveId(item.id)}
            />
          ))}
        </div>

        {/* ── SHOW MORE / EXPAND ACTION ── */}
        {items.length > 6 && (
          <FadeUp delay={0.2} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => Math.min(prev + 6, items.length))}
                className="group relative inline-flex items-center gap-3 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 px-8 py-3.5 text-xs font-mono font-bold uppercase tracking-[0.2em] shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Show More Moments</span>
                <span className="text-[10px] opacity-70 font-mono">
                  ({items.length - displayLimit} remaining)
                </span>
                <motion.span
                  animate={{ y: [0, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  ↓
                </motion.span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setDisplayLimit(6)}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 px-6 py-3 text-xs font-mono font-bold uppercase tracking-[0.2em] hover:bg-neutral-100 dark:hover:bg-neutral-850 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Show Less</span>
                  <span>↑</span>
                </button>
                <Link
                  href="/community/gallery"
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition underline underline-offset-4"
                >
                  <span>Enter Full Visual Archive</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            )}
          </FadeUp>
        )}
      </div>

      {/* ── LIGHTBOX OVERLAY (MATCHING GALLERY PAGE FULL CINEMATIC LIGHTBOX) ── */}
      <Lightbox
        item={active}
        index={activeIndex}
        siblings={visible}
        onClose={() => setActiveId(null)}
        onStep={step}
        onSelect={(id) => setActiveId(id)}
      />
    </section>
  );
}

/* ─────────────────────────────────────────────
   GALLERY TILE — Awwwards-grade buttery smooth
   motion physics with hardware-accelerated zoom,
   specular tracking, and depth elevation
   ───────────────────────────────────────────── */
function GalleryTile({
  item,
  index,
  reduce,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  reduce: boolean;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [isHovered, setIsHovered] = useState(false);
  const isVideo = item.type === 'VIDEO';

  /* ── Interactive Radial Specular Spotlight ── */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 240, damping: 28 });
  const smoothY = useSpring(mouseY, { stiffness: 240, damping: 28 });

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const spotlightBg = useMotionTemplate`radial-gradient(420px circle at ${smoothX}px ${smoothY}px, rgba(255,255,255,0.22), transparent 75%)`;

  return (
    <motion.figure
      ref={ref}
      initial={reduce ? undefined : { opacity: 0, y: 36, scale: 0.98 }}
      animate={
        reduce || inView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 36, scale: 0.98 }
      }
      whileHover={reduce ? undefined : { y: -8 }}
      transition={{
        y: { type: 'spring', stiffness: 220, damping: 24, mass: 0.6 },
        opacity: { duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: inView ? Math.min((index % 8) * 0.06, 0.36) : 0 },
      }}
      className="group break-inside-avoid [will-change:transform]"
    >
      <button
        onClick={onOpen}
        onPointerEnter={(e) => {
          setIsHovered(true);
          handlePointerMove(e);
          const v = videoRef.current;
          if (v) void v.play().catch(() => {});
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          setIsHovered(false);
          const v = videoRef.current;
          if (v) {
            v.pause();
            v.currentTime = 0;
          }
        }}
        className="relative block w-full cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-200/80 dark:border-neutral-800/90 bg-neutral-100 dark:bg-neutral-900 text-left shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:shadow-[0_28px_65px_-10px_rgba(0,0,0,0.22)] dark:group-hover:shadow-[0_28px_65px_-10px_rgba(0,0,0,0.75)] group-hover:border-foreground/35"
      >
        <div className="relative w-full overflow-hidden [will-change:transform] [transform:translateZ(0)]">
          {/* Media — natural intrinsic proportions, no unwanted aspect cropping */}
          {isVideo ? (
            <video
              ref={videoRef}
              src={item.url}
              muted
              loop
              playsInline
              preload="metadata"
              className="block w-full h-auto object-cover transform-gpu backface-hidden [transform-style:preserve-3d]"
            />
          ) : (
            <motion.img
              src={getOptimizedGalleryUrl(item.url, 800)}
              alt={item.caption || TYPE_LABEL[item.type] || 'Gallery archive photo'}
              loading="lazy"
              decoding="async"
              animate={{
                scale: isHovered && !reduce ? 1.075 : 1.0,
                filter: isHovered ? 'contrast(104%) brightness(102%)' : 'contrast(100%) brightness(100%)',
              }}
              transition={{
                scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                filter: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              }}
              className="block w-full h-auto object-cover transform-gpu backface-hidden [transform-style:preserve-3d]"
            />
          )}

          {/* Ambient Radial Specular Sheen tracking pointer */}
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 z-10 mix-blend-overlay"
            style={{ background: spotlightBg }}
          />

          {/* Subtle Dark Velvet Vignette on Hover (20% more transparent) */}
          <motion.div
            animate={{ opacity: isHovered ? 0.28 : 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-black/20"
          />

          {/* Video indicator badge */}
          {isVideo && (
            <span className="pointer-events-none absolute left-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-opacity duration-500 group-hover:opacity-0">
              <span className="ml-0.5 block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />
            </span>
          )}
        </div>
      </button>
    </motion.figure>
  );
}

/* ─────────────────────────────────────────────
   LIGHTBOX — exact Gallery Page modal with
   smooth floating close, prev/next, and filmstrip
   ───────────────────────────────────────────── */
function Lightbox({
  item,
  index,
  siblings,
  onClose,
  onStep,
  onSelect,
}: {
  item: GalleryItem | null;
  index: number;
  siblings: GalleryItem[];
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
  onSelect: (id: string) => void;
}) {
  const isOpen = item !== null;

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose, onStep]);

  // Yield the screen (Navbar fades away) so nothing covers the close button.
  // Keyed on open/close only — stepping between images must not flash it back.
  useEffect(() => {
    if (!isOpen) return;
    yieldChromeToModal();
    return () => restoreChromeFromModal();
  }, [isOpen]);

  // Portal host: only exists after hydration on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const touchX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 48) onStep(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  if (!mounted) return null;

  // Portaled to document.body so the lightbox escapes the below-fold wrapper's
  // z-[300] stacking context — otherwise the fixed Navbar (z-[9999]) paints
  // above it and covers the close button.
  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed inset-0 z-[10000] flex flex-col bg-black/92 backdrop-blur-xl"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={item.caption || 'Gallery media'}
        >
          {/* Floating Premium Close Button */}
          <motion.button
            onClick={onClose}
            aria-label="Close fullscreen modal"
            whileHover={{ scale: 1.08, rotate: 90 }}
            whileTap={{ scale: 0.92 }}
            transition={{
              scale: { type: 'spring', stiffness: 360, damping: 22, mass: 0.6 },
              rotate: { type: 'spring', stiffness: 360, damping: 22, mass: 0.6 },
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-neutral-900/80 hover:bg-white text-white/90 hover:text-black border border-white/25 hover:border-white/60 backdrop-blur-xl transition-colors duration-500 shadow-2xl cursor-pointer"
          >
            <X size={19} />
          </motion.button>

          {/* Media stage */}
          <div
            className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-3 sm:px-6 md:px-16 pt-14 pb-3 select-none"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={onClose}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="flex flex-col items-center max-h-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Media Element */}
                <div className="relative flex items-center justify-center max-h-[58vh] sm:max-h-[66vh] md:max-h-[70vh] max-w-full">
                  <img
                    src={getOptimizedGalleryUrl(item.url, 1600)}
                    alt={item.caption || TYPE_LABEL[item.type]}
                    className="max-h-[58vh] sm:max-h-[66vh] md:max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl border border-white/10"
                  />
                </div>

                {/* Caption Details */}
                <div className="w-full mt-3 sm:mt-3.5 text-center px-3">
                  <p className="font-display text-sm sm:text-base md:text-lg font-normal text-white/95 leading-relaxed max-w-2xl mx-auto">
                    {item.caption || 'Untitled fragment'}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Controls (Tailless Chevrons) */}
            {siblings.length > 1 && (
              <>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStep(-1);
                  }}
                  aria-label="Previous image"
                  whileHover={{ scale: 1.08, x: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22, mass: 0.6 }}
                  className="hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-neutral-900/80 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md transition-colors duration-500 shadow-lg cursor-pointer z-20"
                >
                  <ChevronLeft size={20} className="mr-0.5" />
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStep(1);
                  }}
                  aria-label="Next image"
                  whileHover={{ scale: 1.08, x: 2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22, mass: 0.6 }}
                  className="hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-neutral-900/80 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md transition-colors duration-500 shadow-lg cursor-pointer z-20"
                >
                  <ChevronRight size={20} className="ml-0.5" />
                </motion.button>
              </>
            )}
          </div>

          {/* Bottom Filmstrip */}
          {siblings.length > 1 && (
            <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-1 z-30" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2 sm:gap-2.5 overflow-x-auto justify-center pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {siblings.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    aria-label={s.caption || `Fragment ${i + 1}`}
                    className="group relative h-9 w-12 sm:h-11 sm:w-16 shrink-0 overflow-hidden rounded-md border transition-all duration-300 cursor-pointer"
                    style={{
                      borderColor: i === index ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)',
                      transform: i === index ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <img
                      src={getOptimizedThumbnailUrl(s.url, 120)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-opacity duration-300"
                      style={{ opacity: i === index ? 1 : 0.45 }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
