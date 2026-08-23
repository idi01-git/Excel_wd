"use client";

import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type Transition,
} from "motion/react";
import {
  Newspaper,
  PenTool,
  Feather,
  BookMarked,
  Heart,
  MessageCircle,
  Clock,
  ArrowRight,
  List,
  LayoutGrid,
  Bookmark,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLenis } from "lenis/react";
import { InteractionButton } from "@/components/ui/interaction-button";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import { getOptimizedAvatarUrl, getOptimizedCoverUrl } from "@/lib/image-optimization";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicationItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  readingTime: number;
  content?: any;
  coverImage?: string | null;
  authorName?: string | null;
  authorNote?: string | null;
  alumniProfile?: {
    id: string;
    name: string;
    batch: string;
    branch?: string | null;
    photo?: string | null;
  } | null;
  author: {
    name: string;
    username: string;
    profilePhoto?: string | null;
  };
  _count: {
    comments: number;
    interactions: number;
  };
  hasLiked?: boolean;
  hasBookmarked?: boolean;
}

export type ViewMode = "list" | "card";

// ─── Animation presets ────────────────────────────────────────────────────────

const smoothSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 25,
  mass: 1,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryIcon(category: string) {
  switch (category.toUpperCase()) {
    case "POEM":   return Feather;
    case "STORY":  return PenTool;
    case "REVIEW": return BookMarked;
    default:       return Newspaper;
  }
}

function categoryLabel(category: string) {
  const map: Record<string, string> = {
    ARTICLE: "Article", STORY: "Story", POEM: "Poem", REVIEW: "Review",
  };
  return map[category.toUpperCase()] ?? category;
}

const categoryColor = "bg-gray-50 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700";

function getAuthorDisplayName(pub: PublicationItem) {
  return pub.authorName || pub.alumniProfile?.name || pub.author.name;
}

function avatarSrc(author: PublicationItem["author"], alumniProfile?: PublicationItem["alumniProfile"], authorName?: string | null) {
  if (alumniProfile?.photo && alumniProfile.photo.trim() !== '') {
    return getOptimizedAvatarUrl(alumniProfile.photo, 64);
  }
  if (authorName) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`;
  }
  if (author.profilePhoto && author.profilePhoto.trim() !== '') {
    return getOptimizedAvatarUrl(author.profilePhoto, 64);
  }
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${author.username}`;
}

function coverSrc(pub: PublicationItem) {
  const raw = pub.coverImage ?? "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop";
  return getOptimizedCoverUrl(raw, 800);
}

function extractExcerpt(json: any): string {
  if (!json) return '';
  if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json);
      return extractExcerpt(parsed);
    } catch {
      return json.replace(/<[^>]*>?/gm, '').trim();
    }
  }
  if (typeof json !== 'object') return '';
  if (json.type === 'text' && typeof json.text === 'string') return json.text;
  if (Array.isArray(json.content)) {
    return json.content
      .map(extractExcerpt)
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return '';
}

function getInitialContent(content: any): string[] {
  if (!content || !Array.isArray(content.content)) return [];
  const paragraphs: string[] = [];
  
  for (const block of content.content) {
    if (block.type === 'paragraph' || block.type === 'heading') {
      const text = extractExcerpt(block);
      if (text.trim()) {
        paragraphs.push(text.trim());
      }
    }
  }
  return paragraphs.slice(0, 2);
}

// ─── Local State Wrapper for Interaction Button ────────────────────────────────

// Preview engagement state

type PreviewInteractionType = 'LIKE' | 'BOOKMARK';

function usePreviewInteractions(params: {
  slug: string;
  initialLikeCount: number;
  initialLiked?: boolean;
  initialBookmarked?: boolean;
  onRequireAuth?: (action: string) => void;
}) {
  const { data: session } = useSession();
  const [likeCount, setLikeCount] = useState(params.initialLikeCount);
  const [hasLiked, setHasLiked] = useState(params.initialLiked ?? false);
  const [hasBookmarked, setHasBookmarked] = useState(params.initialBookmarked ?? false);
  const [pendingInteraction, setPendingInteraction] = useState<PreviewInteractionType | null>(null);

  useEffect(() => {
    setLikeCount(params.initialLikeCount);
  }, [params.initialLikeCount]);

  useEffect(() => {
    setHasLiked(params.initialLiked ?? false);
  }, [params.initialLiked]);

  useEffect(() => {
    setHasBookmarked(params.initialBookmarked ?? false);
  }, [params.initialBookmarked]);

  const toggleLike = async () => {
    if (!session) {
      params.onRequireAuth?.('like this publication');
      return;
    }
    if (pendingInteraction) return;
    const nextLiked = !hasLiked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    // Optimistic update
    setHasLiked(nextLiked);
    setLikeCount(nextCount);
    setPendingInteraction('LIKE');

    try {
      const res = await fetch(`/api/publications/${params.slug}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'LIKE' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          params.onRequireAuth?.('like this publication');
        }
        // Revert on failure
        setHasLiked(!nextLiked);
        setLikeCount(likeCount);
      } else if (data.counts) {
        setLikeCount(data.counts.likes);
        if (data.userState && typeof data.userState.liked === 'boolean') {
          setHasLiked(data.userState.liked);
        }
      }
    } catch {
      // Revert on error
      setHasLiked(!nextLiked);
      setLikeCount(likeCount);
    } finally {
      setPendingInteraction(null);
    }
  };

  const toggleBookmark = async () => {
    if (!session) {
      params.onRequireAuth?.('bookmark this publication');
      return;
    }
    if (pendingInteraction) return;
    const nextBookmarked = !hasBookmarked;
    
    // Optimistic update
    setHasBookmarked(nextBookmarked);
    setPendingInteraction('BOOKMARK');

    try {
      const res = await fetch(`/api/publications/${params.slug}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'BOOKMARK' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          params.onRequireAuth?.('bookmark this publication');
        }
        setHasBookmarked(!nextBookmarked);
      } else if (data.userState && typeof data.userState.bookmarked === 'boolean') {
        setHasBookmarked(data.userState.bookmarked);
      }
    } catch {
      setHasBookmarked(!nextBookmarked);
    } finally {
      setPendingInteraction(null);
    }
  };

  return {
    likeCount,
    hasLiked,
    hasBookmarked,
    pendingInteraction,
    toggleLike,
    toggleBookmark,
  };
}

function LocalInteractionButton({ icon, count, activeColor, withConfetti, withFill, active = false, disabled = false, onInteract }: {
  icon: LucideIcon;
  count?: number;
  activeColor: string;
  withConfetti?: boolean;
  withFill?: boolean;
  active?: boolean;
  disabled?: boolean;
  onInteract?: (e: React.MouseEvent) => void | Promise<void>;
}) {
  return (
    <InteractionButton
      icon={icon}
      count={count}
      active={active}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onInteract?.(e);
      }}
      activeColor={activeColor}
      withConfetti={withConfetti}
      withFill={withFill}
      size={14}
    />
  );
}

function ExpandedPanel({
  pub,
  layoutId,
  onClose,
  likeCount,
  hasLiked,
  hasBookmarked,
  pendingInteraction,
  onToggleLike,
  onToggleBookmark,
}: {
  pub: PublicationItem;
  layoutId: string;
  onClose: () => void;
  likeCount: number;
  hasLiked: boolean;
  hasBookmarked: boolean;
  pendingInteraction: PreviewInteractionType | null;
  onToggleLike: () => void | Promise<void>;
  onToggleBookmark: () => void | Promise<void>;
}) {
  const icon  = categoryIcon(pub.category);
  const panelRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background smooth scroll & html/body scroll when publication modal is open
  useEffect(() => {
    lenis?.stop();
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      lenis?.start();
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('overflow-hidden');
      document.body.style.overflow = origBodyOverflow || '';
      document.documentElement.style.overflow = origHtmlOverflow || '';
    };
  }, [lenis]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[99998] bg-black/60 dark:bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel-wrapper"
        data-lenis-prevent
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-6 pointer-events-none"
      >
        <motion.div
          layoutId={layoutId}
          ref={panelRef}
          data-lenis-prevent
          transition={smoothSpring}
          className="pointer-events-auto w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-t-3xl sm:rounded-3xl [-webkit-overflow-scrolling:touch] [scrollbar-width:none] text-neutral-900 dark:text-neutral-100"
          style={{ originX: 0.5, originY: 0.5 }}
        >
          {/* Cover image */}
          <motion.div layoutId={`${layoutId}-img`} transition={smoothSpring} className="relative shrink-0">
            <img
              src={coverSrc(pub)}
              alt={pub.title}
              className="w-full h-64 object-cover rounded-t-3xl sm:rounded-t-3xl"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-[#0e0e0e] to-transparent" />
          </motion.div>

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-4 pb-2">
            <div className="min-w-0 flex-1">
              <motion.p layoutId={`${layoutId}-desc`} transition={smoothSpring} className="text-xs font-semibold text-gray-500 dark:text-neutral-400 mb-1 flex items-center flex-wrap gap-1">
                <span>{categoryLabel(pub.category)} &middot;</span>
                <Link
                  href={pub.author?.username ? `/profile/${pub.author.username}` : '#'}
                  onClick={onClose}
                  className="font-bold text-gray-800 dark:text-neutral-200"
                >
                  {getAuthorDisplayName(pub)}
                </Link>
                {pub.alumniProfile && (
                  <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Alumni &middot; Class of {pub.alumniProfile.batch}
                  </span>
                )}
                {pub.authorNote && !pub.alumniProfile && (
                  <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    {pub.authorNote}
                  </span>
                )}
              </motion.p>
              <motion.h2 layoutId={`${layoutId}-title`} transition={smoothSpring} className="text-2xl font-bold text-black dark:text-white font-serif leading-tight break-words">
                {pub.title}
              </motion.h2>
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="ml-4 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white transition"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body content */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="px-6 pb-8 flex flex-col gap-5"
          >
            {/* Tags, Reading time, and Interactions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={cn("flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md", categoryColor)}>
                  {React.createElement(icon, { size: 10, strokeWidth: 2 })}
                  {categoryLabel(pub.category)}
                </span>
                {pub.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[11px] text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-[11px] text-gray-500 dark:text-neutral-400 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-neutral-800">
                <span className="flex items-center gap-1.5 text-gray-400 dark:text-neutral-500">
                  <Clock size={12} strokeWidth={1.5} className="text-gray-400 dark:text-neutral-500" />
                  {pub.readingTime} min read
                </span>

                <div className="flex items-center gap-3.5 sm:gap-4">
                  <LocalInteractionButton 
                    icon={Heart} 
                    count={likeCount} 
                    active={hasLiked}
                    disabled={pendingInteraction !== null}
                    activeColor="text-red-500" 
                    onInteract={onToggleLike}
                    withConfetti 
                  />
                  <span className="flex items-center gap-1.5 text-gray-400 dark:text-neutral-500">
                    <MessageCircle size={14} strokeWidth={1.5} />
                    <span className="font-medium text-gray-500 dark:text-neutral-300">{pub._count.comments}</span>
                  </span>
                  <LocalInteractionButton 
                    icon={Bookmark} 
                    active={hasBookmarked}
                    disabled={pendingInteraction !== null}
                    activeColor="text-yellow-500" 
                    onInteract={onToggleBookmark}
                    withConfetti 
                  />
                </div>
              </div>
            </div>

            {/* Initial Content (Excerpt) */}
            <div className="text-[13px] text-gray-600 dark:text-neutral-300 leading-relaxed space-y-4">
              {getInitialContent(pub.content).map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={`/publications/${pub.slug}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-black hover:bg-gray-900 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-semibold text-sm transition-all shadow-sm mt-1"
            >
              Read Full {categoryLabel(pub.category)}
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </>,
    document.body
  );
}

// ─── Unified Publication Item (Layout Morphing) ────────────────────────────────

function UnifiedPublicationItem({
  pub,
  engagement,
  view,
}: {
  pub: PublicationItem;
  engagement: ReturnType<typeof usePreviewInteractions>;
  view: ViewMode;
}) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const layoutId = `pub-unified-${pub.id}`;
  const icon  = categoryIcon(pub.category);
  const reduce = useReducedMotion();

  // ─── Awwwards-Level Magnetic Interactive Micro-Physics ───
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const isHovered = useMotionValue(0);

  // Critically damped spring physics for zero-lag silky tracking
  const sx = useSpring(mx, { stiffness: 220, damping: 28, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 220, damping: 28, mass: 0.5 });
  const sh = useSpring(isHovered, { stiffness: 240, damping: 26 });

  // Subtle 3D tilt
  const rotX = useTransform(sy, [-0.5, 0.5], [4.5, -4.5]);
  const rotY = useTransform(sx, [-0.5, 0.5], [-4.5, 4.5]);

  // Liquid spring scale and elevation lift
  const cardScale = useTransform(sh, [0, 1], [1, 1.018]);
  const cardLift = useTransform(sh, [0, 1], [0, -6]);

  // Subtle parallax depth on cover image
  const imgZoom = useTransform(sh, [0, 1], [1, 1.08]);
  const imgX = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const imgY = useTransform(sy, [-0.5, 0.5], [-5, 5]);

  // Multi-stop liquid luxury shadow lift
  const shadowLift = useTransform(
    sh,
    [0, 1],
    [
      "0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)",
      "0 26px 52px -12px rgba(0, 0, 0, 0.13), 0 12px 24px -6px rgba(0, 0, 0, 0.06)",
    ]
  );

  const rectRef = useRef<DOMRect | null>(null);

  const onPointerEnter = () => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
    isHovered.set(1);
    if (pub?.slug) {
      fetch(`/api/publications/${pub.slug}`).catch(() => {});
      fetch(`/api/publications/${pub.slug}/comments?limit=3&sort=new`).catch(() => {});
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce) return;
    if (!rectRef.current && cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    if (!rect || rect.width === 0 || rect.height === 0) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    rectRef.current = null;
    isHovered.set(0);
    mx.set(0);
    my.set(0);
  };

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <ExpandedPanel 
            pub={pub} 
            layoutId={layoutId} 
            onClose={() => setExpanded(false)} 
            likeCount={engagement.likeCount}
            hasLiked={engagement.hasLiked} 
            hasBookmarked={engagement.hasBookmarked} 
            pendingInteraction={engagement.pendingInteraction}
            onToggleLike={engagement.toggleLike} 
            onToggleBookmark={engagement.toggleBookmark} 
          />
        )}
      </AnimatePresence>

      <motion.article
        ref={cardRef}
        layout
        layoutId={layoutId}
        onClick={() => setExpanded(true)}
        onPointerMove={onPointerMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        transition={smoothSpring}
        style={{
          perspective: 1200,
          rotateX: reduce ? 0 : rotX,
          rotateY: reduce ? 0 : rotY,
          y: reduce ? 0 : cardLift,
          boxShadow: shadowLift,
          transformStyle: "preserve-3d",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          transform: "translate3d(0,0,0)",
        }}
        className={`group relative overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-white/10 cursor-pointer isolate ${
          view === "list"
            ? "flex flex-row items-stretch p-3.5 sm:p-5 md:p-0 md:flex-row md:gap-0 md:h-52 rounded-2xl md:rounded-3xl"
            : "flex flex-col rounded-3xl"
        }`}
      >
        {/* Cover Thumbnail / Banner */}
        <motion.div
          layout
          className={`${
            view === "list"
              ? "order-2 md:order-1 w-24 h-24 xs:w-28 xs:h-28 sm:w-36 sm:h-36 md:w-1/3 aspect-square md:aspect-auto md:h-full relative overflow-hidden shrink-0 rounded-xl md:rounded-none border md:border-b-0 md:border-r border-gray-100 dark:border-white/5 [transform:translateZ(0)] self-center md:self-stretch"
              : "w-full aspect-[4/3] relative overflow-hidden shrink-0 border-b border-gray-100 dark:border-white/5 [transform:translateZ(0)]"
          }`}
        >
          <motion.div
            style={{
              scale: reduce ? 1 : imgZoom,
              x: reduce ? 0 : imgX,
              y: reduce ? 0 : imgY,
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
            className="w-full h-full md:absolute md:inset-0 will-change-transform transform-gpu"
          >
            <motion.img
              layout
              layoutId={`${layoutId}-img`}
              src={coverSrc(pub)}
              alt={pub.title}
              className="w-full h-full object-cover select-none"
            />
          </motion.div>
          
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Category Badge on Image (Grid & Desktop List) */}
          <span className={cn(
            "absolute top-3 left-3 items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md transition-transform duration-300 group-hover:scale-105 shadow-xs",
            categoryColor,
            view === "list" ? "hidden md:flex" : "flex"
          )}>
            {React.createElement(icon, { size: 9, strokeWidth: 2 })}
            {categoryLabel(pub.category)}
          </span>
        </motion.div>

        {/* Content Section */}
        <motion.div 
          layout 
          className={`${
            view === "list"
              ? "order-1 md:order-2 flex flex-col flex-1 min-w-0 justify-between md:h-full md:p-5 md:pb-2.5 lg:p-6 lg:pb-3 [transform:translateZ(0)] antialiased"
              : "flex flex-col flex-1 p-5 pb-2.5 md:p-6 md:pb-3 justify-between min-w-0 [transform:translateZ(0)] antialiased"
          }`}
        >
          <div>
            {/* Mobile Category Badge in List Mode */}
            {view === "list" && (
              <div className="flex md:hidden items-center gap-2 flex-wrap mb-1.5 sm:mb-2.5">
                <span className={cn("inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full border shadow-xs", categoryColor)}>
                  {React.createElement(icon, { size: 9, strokeWidth: 2 })}
                  {categoryLabel(pub.category)}
                </span>
                {pub.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] text-gray-500 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2 py-0.5 rounded-full hidden xs:inline-block">#{tag}</span>
                ))}
              </div>
            )}

            {/* Desktop Tags in List / Grid Mode */}
            <div className={cn("gap-1.5 flex-wrap mb-2 md:mb-2.5", view === "list" ? "hidden md:flex" : "flex")}>
              {pub.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-gray-500 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>

            <motion.h3
              layout
              layoutId={`${layoutId}-title`}
              className={`${
                view === "list"
                  ? "font-serif text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black dark:text-white leading-snug md:leading-tight line-clamp-2 mb-1 sm:mb-1.5 md:mb-2 break-words"
                  : "font-serif text-xl font-bold text-black dark:text-white leading-tight mb-2 line-clamp-2 break-words"
              } transition-colors duration-300 group-hover:text-black dark:group-hover:text-white`}
            >
              {pub.title}
            </motion.h3>
            <motion.p
              layout
              layoutId={`${layoutId}-desc`}
              className="text-gray-600 dark:text-neutral-400 text-xs md:text-sm line-clamp-2 mb-2 sm:mb-3 md:mb-0 leading-relaxed"
            >
              {extractExcerpt(pub.content) || `Read the full ${categoryLabel(pub.category).toLowerCase()} by ${getAuthorDisplayName(pub)}.`}
            </motion.p>
          </div>
          
          <motion.div
            layout
            className={cn(
              "flex items-center justify-between gap-2 sm:gap-3 text-xs text-gray-500 font-medium tracking-wide mt-auto pt-3 md:pt-3.5 border-t border-gray-100 dark:border-white/5",
              view === "list" && "pt-2 sm:pt-3 md:pt-2 md:border-t-0"
            )}
          >
            <Link
              href={pub.author?.username ? `/profile/${pub.author.username}` : '#'}
              onClick={(e) => {
                if (pub.author?.username) {
                  e.stopPropagation();
                }
              }}
              className="flex items-center gap-1.5 sm:gap-2 min-w-0 z-10 cursor-pointer"
            >
              <img
                src={avatarSrc(pub.author, pub.alumniProfile, pub.authorName)}
                alt={getAuthorDisplayName(pub)}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-gray-200 dark:border-neutral-700 shrink-0"
              />
              <span className="truncate text-gray-700 dark:text-neutral-200 font-bold text-[11px] sm:text-xs">
                {getAuthorDisplayName(pub)}
              </span>
              {pub.alumniProfile && (
                <span className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                  Alumni
                </span>
              )}
              {view === "list" && (
                <>
                  <span className="hidden md:inline-block w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-700" />
                  <span className="hidden md:inline-block uppercase text-[10px] font-bold text-gray-400 dark:text-neutral-500">
                    {pub.readingTime} min read
                  </span>
                </>
              )}
            </Link>

            <div className="flex items-center gap-2.5 sm:gap-3 ml-auto shrink-0">
              <LocalInteractionButton 
                icon={Heart} 
                count={engagement.likeCount} 
                active={engagement.hasLiked}
                disabled={engagement.pendingInteraction !== null}
                activeColor="text-red-500" 
                onInteract={engagement.toggleLike}
              />
              <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400">
                <MessageCircle size={12} strokeWidth={1.5} />
                <span className="font-medium text-gray-600 dark:text-neutral-300">{pub._count.comments}</span>
              </span>
              <LocalInteractionButton 
                icon={Bookmark} 
                active={engagement.hasBookmarked}
                disabled={engagement.pendingInteraction !== null}
                activeColor="text-yellow-500" 
                onInteract={engagement.toggleBookmark}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.article>
    </>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function Tab({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: LucideIcon; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all rounded-full outline-none cursor-pointer",
        active
          ? "text-white dark:text-neutral-950"
          : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
      )}
    >
      {active && (
        <motion.div
          layoutId="pub-active-tab"
          className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full shadow-sm"
          transition={smoothSpring}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <Icon size={14} strokeWidth={1.8} className={cn("transition-transform duration-300", active && "scale-110")} />
        {label}
      </span>
    </button>
  );
}

// ─── Wrapper for persisting state across view toggles ───────────

function PublicationWrapper({ 
  pub, 
  view,
  onRequireAuth
}: { 
  pub: PublicationItem; 
  view: ViewMode;
  onRequireAuth: (action: string) => void;
}) {
  const engagement = usePreviewInteractions({
    slug: pub.slug,
    initialLikeCount: pub._count.interactions,
    initialLiked: pub.hasLiked,
    initialBookmarked: pub.hasBookmarked,
    onRequireAuth,
  });

  return <UnifiedPublicationItem pub={pub} engagement={engagement} view={view} />;
}

// ─── Exported Responsive ViewToggle ─────────────────────────────────────────

export function ViewToggle({
  view,
  onChange,
  className,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
  className?: string;
}) {
  const isList = view === "list";
  const toggle = () => onChange(isList ? "card" : "list");

  return (
    <>
      {/* Mobile View: Single Morphing Icon Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        title={isList ? "Switch to Grid view" : "Switch to List view"}
        aria-label={isList ? "Switch to Grid view" : "Switch to List view"}
        className={cn(
          "md:hidden relative flex items-center justify-center h-10 w-10 rounded-full bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 transition-colors shadow-xs cursor-pointer overflow-hidden shrink-0 select-none",
          className
        )}
      >
        <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={false}
            animate={{
              rotate: isList ? 0 : -90,
              scale: isList ? 1 : 0.2,
              opacity: isList ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <List size={16} strokeWidth={2} />
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              rotate: !isList ? 0 : 90,
              scale: !isList ? 1 : 0.2,
              opacity: !isList ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <LayoutGrid size={16} strokeWidth={2} />
          </motion.div>
        </div>
      </motion.button>

      {/* Desktop View: Full Two-Tab Pill with Icons & Labels */}
      <div className={cn("hidden md:flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full w-fit border border-neutral-200/80 dark:border-neutral-800 gap-0.5", className)}>
        <LayoutGroup id="collection-view-toggle-desktop">
          <Tab active={view === "list"} onClick={() => onChange("list")} icon={List} label="List" />
          <Tab active={view === "card"} onClick={() => onChange("card")} icon={LayoutGrid} label="Grid" />
        </LayoutGroup>
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PublicationCollection({
  publications,
  view: controlledView,
  onViewChange,
}: {
  publications: PublicationItem[];
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
}) {
  const [internalView, setInternalView] = useState<ViewMode>("list");
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginAction, setLoginAction] = useState('interact with this publication');

  const handleRequireAuth = (action: string) => {
    setLoginAction(action);
    setLoginPromptOpen(true);
  };

  const view = controlledView ?? internalView;
  const setView = onViewChange ?? setInternalView;

  return (
    <div className="w-full font-sans">
      <div className="flex flex-col gap-6">

        {/* View toggle (only if not externally controlled) */}
        {!controlledView && (
          <>
            <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full w-fit border border-neutral-200/80 dark:border-neutral-800 gap-0.5">
              <LayoutGroup id="collection-view-toggle">
                <Tab active={view === "list"} onClick={() => setView("list")} icon={List} label="List" />
                <Tab active={view === "card"} onClick={() => setView("card")} icon={LayoutGrid} label="Grid" />
              </LayoutGroup>
            </div>
            <div className="h-px bg-neutral-200 dark:bg-neutral-800 w-full" />
          </>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {publications.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl"
            >
              <p className="text-lg text-neutral-600 dark:text-neutral-400 font-serif">No publications found</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">Try shifting filters or clearing your search term.</p>
            </motion.div>
          ) : (
            <motion.div
              key="publications-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn(
                "w-full",
                view === "list" && "flex flex-col gap-6",
                view === "card" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              )}
            >
              {publications.map((pub) => (
                <PublicationWrapper key={pub.id} pub={pub} view={view} onRequireAuth={handleRequireAuth} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={loginPromptOpen}
        action={loginAction}
        onClose={() => setLoginPromptOpen(false)}
      />
    </div>
  );
}
