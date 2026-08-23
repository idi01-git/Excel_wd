'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Eyebrow, FadeUp, RevealWords, EASE } from '@/components/home/primitives';
import { RevealButton } from '@/components/ui/RevealButton';
import { getOptimizedGalleryUrl, getOptimizedThumbnailUrl } from '@/lib/image-optimization';

export interface GalleryItem {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'POSTER' | 'MEMORY';
  url: string;
  caption?: string | null;
  createdAt: string;
}



/**
 * Container width adapts to archive size (site standard is max-w-7xl).
 * Column count is applied ONLY to the masonry element itself.
 */
function wallWidth(_n: number) {
  return 'max-w-7xl';
}

function wallColumns(n: number) {
  if (n <= 1) return 'columns-1';
  return 'columns-1 sm:columns-2 lg:columns-3';
}

export default function GalleryShowcase() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/community/gallery');
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setItems(data.items);
        }
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const visible = items.slice(0, displayLimit);
  const hasMore = displayLimit < items.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayLimit((prev) => Math.min(prev + 10, items.length));
      setLoadingMore(false);
    }, 350);
  };

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

  /* layout adapts to archive size — no half-empty desktop columns */
  const width = wallWidth(items.length || 9);
  const cols = wallColumns(items.length || 9);

  return (
    <div className="relative w-full overflow-x-clip bg-background font-sans">
      {/* ── HERO — Grand Editorial Header with Memory Symbol ── */}
      <div className="relative px-6 pt-16 pb-8 md:px-10 md:pt-20 md:pb-10">
        <div className={`relative mx-auto ${width}`}>
          {/* Ghost background Literary Twin-Lens Reflex (TLR) Camera watermark extending behind images */}
          <div className="pointer-events-none absolute -right-2 -top-6 select-none z-0 md:-top-10 md:right-4">
            <svg
              viewBox="0 0 420 500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[clamp(11rem,24vw,20rem)] h-auto text-foreground opacity-[0.065] dark:opacity-[0.13] transform -rotate-3"
            >
              {/* Top Pop-up Waist-Level Viewfinder Hood */}
              <path
                d="M 126 96 L 146 36 L 274 36 L 294 96"
                stroke="currentColor"
                strokeWidth="26"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Main Vertical TLR Camera Body */}
              <rect x="80" y="96" width="260" height="364" rx="34" stroke="currentColor" strokeWidth="28" />

              {/* Archival Badge / Nameplate Bar */}
              <rect x="114" y="118" width="192" height="34" rx="8" stroke="currentColor" strokeWidth="20" />

              {/* Upper Viewing Lens (The Eye / Viewfinder) */}
              <circle cx="210" cy="214" r="48" stroke="currentColor" strokeWidth="26" />
              <circle cx="210" cy="214" r="22" stroke="currentColor" strokeWidth="20" />
              <circle cx="202" cy="206" r="7" fill="currentColor" />

              {/* Center Lens Board Bracket */}
              <rect x="178" y="254" width="64" height="32" rx="6" stroke="currentColor" strokeWidth="18" />

              {/* Lower Taking Lens (The Memory / Shutter) */}
              <circle cx="210" cy="344" r="56" stroke="currentColor" strokeWidth="28" />
              <circle cx="210" cy="344" r="28" stroke="currentColor" strokeWidth="22" />
              <circle cx="200" cy="334" r="9" fill="currentColor" />

              {/* Left Side Focusing Knob */}
              <rect x="52" y="240" width="28" height="74" rx="8" stroke="currentColor" strokeWidth="22" />

              {/* Right Side Film Winding Crank */}
              <path d="M 340 234 C 378 234 378 304 340 304" stroke="currentColor" strokeWidth="24" strokeLinecap="round" />
              <circle cx="366" cy="269" r="11" fill="currentColor" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8">
            <div>
              <h1 className="font-display text-[clamp(2.6rem,7vw,5.8rem)] font-medium leading-[0.95] tracking-[-0.03em] text-foreground">
                <RevealWords text="Moments," delay={0.1} />{' '}
                <em className="font-normal italic">
                  <RevealWords text="kept." delay={0.3} />
                </em>
              </h1>

              <FadeUp delay={0.35} className="mt-5">
                <p className="max-w-lg text-sm md:text-base leading-relaxed text-muted-foreground font-sans">
                  A visual archive of captured memories, event posters, film frames, and timeless club chronicles.
                </p>
              </FadeUp>
            </div>
          </div>
        </div>
      </div>

      {/* ── PHOTO WALL — masonry, natural ratios ── */}
      <div className="relative z-10 px-2 pb-24 pt-4 sm:px-4 md:px-10 md:pb-36 md:pt-6">
        <div className={`mx-auto ${width}`}>
          {loading ? (
            <div className={`${cols} gap-3 md:gap-5 [&>*]:mb-3 md:[&>*]:mb-5`}>
              {[1.3, 0.8, 1, 1.2, 0.75, 1.4, 0.9, 1.1].map((h, n) => (
                <div key={n} className="animate-pulse rounded-md bg-foreground/[0.05]" style={{ height: `${h * 200}px` }} />
              ))}
            </div>
          ) : visible.length > 0 ? (
            <>
              <div className={`${cols} gap-5 sm:gap-6 md:gap-8 [&>*]:mb-5 sm:[&>*]:mb-6 md:[&>*]:mb-8`}>
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

              {/* ── LOAD MORE BUTTON & ARCHIVE END INDICATOR ── */}
              {hasMore ? (
                <div className="mt-14 md:mt-20 flex flex-col items-center justify-center">
                  <RevealButton label="Unfold" onClick={handleLoadMore} loading={loadingMore} />
                  <span className="mt-3 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                    {visible.length} / {items.length}
                  </span>
                </div>
              ) : (
                <div className="mt-14 md:mt-20 flex items-center justify-center gap-3 text-muted-foreground/60 font-mono text-[10px] uppercase tracking-[0.24em]">
                  <span className="h-px w-10 bg-border" />
                  <span>End of Visual Archive</span>
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
              The archive is empty — for now.
            </motion.div>
          )}
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      <Lightbox
        item={active}
        index={activeIndex}
        siblings={items}
        onClose={() => setActiveId(null)}
        onStep={step}
        onSelect={(id) => setActiveId(id)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   TILE — image-first. Natural ratio, always
   visible. Rise+fade reveal, rich hover state.
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
          {/* Media — ultra-smooth, seamless hardware accelerated zoom */}
          {isVideo ? (
            <video
              ref={videoRef}
              src={item.url}
              muted
              loop
              playsInline
              preload="metadata"
              className="block w-full object-cover transform-gpu backface-hidden [transform-style:preserve-3d]"
            />
          ) : (
            <motion.img
              src={getOptimizedGalleryUrl(item.url, 800)}
              alt={item.caption || 'Gallery archive photo'}
              loading="lazy"
              animate={{
                scale: isHovered && !reduce ? 1.075 : 1.0,
                filter: isHovered ? 'contrast(104%) brightness(102%)' : 'contrast(100%) brightness(100%)',
              }}
              transition={{
                scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                filter: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              }}
              className="block w-full object-cover transform-gpu backface-hidden [transform-style:preserve-3d]"
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
   LIGHTBOX — cinematic, keyboard + filmstrip
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

  return (
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

          {/* Media stage — centered content with details attached directly beneath the image */}
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
                {/* Media Element (Image / Video) */}
                <div className="relative flex items-center justify-center max-h-[58vh] sm:max-h-[66vh] md:max-h-[70vh] max-w-full">
                  {item.type === 'VIDEO' ? (
                    <video
                      src={item.url}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="max-h-[58vh] sm:max-h-[66vh] md:max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl border border-white/10"
                    />
                  ) : (
                    <img
                      src={getOptimizedGalleryUrl(item.url, 1600)}
                      alt={item.caption || 'Gallery archive photo'}
                      className="max-h-[58vh] sm:max-h-[66vh] md:max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl border border-white/10"
                    />
                  )}
                </div>

                {/* Caption Details — Directly below where the image ends */}
                <div className="w-full mt-3 sm:mt-3.5 text-center px-3">
                  <p className="font-display text-sm sm:text-base md:text-lg font-normal text-white/95 leading-relaxed max-w-2xl mx-auto">
                    {item.caption || 'Untitled fragment'}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Desktop-only Navigation Controls with smooth spring feedback (Tailless Chevrons) */}
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
                    {s.type === 'VIDEO' ? (
                      <video src={s.url} muted preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src={getOptimizedThumbnailUrl(s.url, 120)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-opacity duration-300"
                        style={{ opacity: i === index ? 1 : 0.45 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
