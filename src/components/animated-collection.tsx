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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { InteractionButton } from "@/components/ui/interaction-button";

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

const categoryColor = "bg-gray-50 text-gray-700 border-gray-200";

function getAuthorDisplayName(pub: PublicationItem) {
  return pub.authorName || pub.alumniProfile?.name || pub.author.name;
}

function avatarSrc(author: PublicationItem["author"], alumniProfile?: PublicationItem["alumniProfile"], authorName?: string | null) {
  if (alumniProfile?.photo && alumniProfile.photo.trim() !== '') {
    return alumniProfile.photo;
  }
  if (authorName) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`;
  }
  return author.profilePhoto ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${author.username}`;
}

function coverSrc(pub: PublicationItem) {
  return pub.coverImage ?? "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop";
}

function extractExcerpt(json: any): string {
  if (!json || typeof json !== 'object') return '';
  if (json.type === 'text' && typeof json.text === 'string') return json.text;
  if (Array.isArray(json.content)) {
    return json.content.map(extractExcerpt).join(' ').trim();
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
}) {
  const [likeCount, setLikeCount] = useState(params.initialLikeCount);
  const [hasLiked, setHasLiked] = useState(params.initialLiked ?? false);
  const [hasBookmarked, setHasBookmarked] = useState(params.initialBookmarked ?? false);
  const [pendingInteraction, setPendingInteraction] = useState<PreviewInteractionType | null>(null);

  const toggleLike = async () => {
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
      if (!data.success) {
        // Revert
        setHasLiked(!nextLiked);
        setLikeCount(likeCount);
      } else {
        // Confirm server count
        setLikeCount(data.counts.likes);
        setHasLiked(data.userState.liked);
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
      if (!data.success) {
        setHasBookmarked(!nextBookmarked);
      } else {
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

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-45 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 pointer-events-none"
      >
        <motion.div
          layoutId={layoutId}
          ref={panelRef}
          transition={smoothSpring}
          className="pointer-events-auto w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-t-3xl sm:rounded-3xl [-webkit-overflow-scrolling:touch] [scrollbar-width:none] text-black"
          style={{ originX: 0.5, originY: 0.5 }}
        >
          {/* Cover image */}
          <motion.div layoutId={`${layoutId}-img`} transition={smoothSpring} className="relative shrink-0">
            <img
              src={coverSrc(pub)}
              alt={pub.title}
              className="w-full h-64 object-cover rounded-t-3xl sm:rounded-t-3xl"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
          </motion.div>

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-4 pb-2">
            <div className="min-w-0 flex-1">
              <motion.p layoutId={`${layoutId}-desc`} transition={smoothSpring} className="text-xs font-semibold text-gray-500 mb-1">
                {categoryLabel(pub.category)} &middot; {getAuthorDisplayName(pub)}
                {pub.alumniProfile && (
                  <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Alumni &middot; Class of {pub.alumniProfile.batch}
                  </span>
                )}
                {pub.authorNote && !pub.alumniProfile && (
                  <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    {pub.authorNote}
                  </span>
                )}
              </motion.p>
              <motion.h2 layoutId={`${layoutId}-title`} transition={smoothSpring} className="text-2xl font-bold text-black font-serif leading-tight">
                {pub.title}
              </motion.h2>
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              className="ml-4 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-black transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
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
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className={cn("flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md", categoryColor)}>
                {React.createElement(icon, { size: 10, strokeWidth: 2 })}
                {categoryLabel(pub.category)}
              </span>
              {pub.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
              <div className="ml-auto flex items-center gap-4 text-[11px] text-gray-500">
                <LocalInteractionButton 
                  icon={Heart} 
                  count={likeCount} 
                  active={hasLiked}
                  disabled={pendingInteraction !== null}
                  activeColor="text-red-500" 
                  onInteract={onToggleLike}
                  withConfetti 
                />
                <span className="flex items-center gap-1.5 text-gray-400">
                  <MessageCircle size={14} strokeWidth={1.5} />
                  <span className="font-medium text-gray-500">{pub._count.comments}</span>
                </span>
                <LocalInteractionButton 
                  icon={Bookmark} 
                  active={hasBookmarked}
                  disabled={pendingInteraction !== null}
                  activeColor="text-yellow-500" 
                  onInteract={onToggleBookmark}
                  withConfetti 
                />
                
                <div className="w-px h-3 bg-gray-200 mx-1" />
                
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Clock size={12} strokeWidth={1.5} className="text-gray-300" />
                  {pub.readingTime} min
                </span>
              </div>
            </div>

            {/* Initial Content (Excerpt) */}
            <div className="text-[13px] text-gray-600 leading-relaxed space-y-4">
              {getInitialContent(pub.content).map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={`/publications/${pub.slug}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-black hover:bg-gray-900 text-white font-semibold text-sm transition-all shadow-sm mt-1"
            >
              Read Full {categoryLabel(pub.category)}
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
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

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerEnter = () => {
    isHovered.set(1);
  };

  const onPointerLeave = () => {
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
        className={`group relative overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-white/10 rounded-3xl cursor-pointer isolate ${
          view === "list"
            ? "flex flex-col md:flex-row"
            : "flex flex-col"
        }`}
      >
        <motion.div
          layout
          className={`${
            view === "list"
              ? "w-full md:w-1/3 aspect-[4/3] md:aspect-auto md:min-h-[200px]"
              : "w-full aspect-[4/3]"
          } relative overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 [transform:translateZ(0)]`}
        >
          <motion.div
            style={{
              scale: reduce ? 1 : imgZoom,
              x: reduce ? 0 : imgX,
              y: reduce ? 0 : imgY,
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
            className="w-full h-full will-change-transform transform-gpu"
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
          
          <span className={cn("absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md transition-transform duration-300 group-hover:scale-105 shadow-xs", categoryColor)}>
            {React.createElement(icon, { size: 9, strokeWidth: 2 })}
            {categoryLabel(pub.category)}
          </span>
        </motion.div>

        <motion.div layout className="flex flex-col flex-1 p-5 md:p-6 justify-between min-w-0 [transform:translateZ(0)] antialiased">
          <div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {pub.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-gray-500 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
            <motion.h3
              layout
              layoutId={`${layoutId}-title`}
              className={`${
                view === "list"
                  ? "font-serif text-2xl font-bold text-black dark:text-white mb-3 leading-tight line-clamp-2"
                  : "font-serif text-xl font-bold text-black dark:text-white leading-tight mb-2 line-clamp-2"
              } transition-colors duration-300 group-hover:text-black dark:group-hover:text-white`}
            >
              {pub.title}
            </motion.h3>
            <motion.p
              layout
              layoutId={`${layoutId}-desc`}
              className="text-gray-600 text-xs md:text-sm line-clamp-2 mb-4 leading-relaxed"
            >
              Read the full {categoryLabel(pub.category).toLowerCase()} to discover more insights.
            </motion.p>
          </div>
          
          <motion.div
            layout
            className="flex items-center justify-between gap-3 text-xs text-gray-500 font-medium tracking-wide mt-auto pt-3.5 border-t border-gray-100 dark:border-white/5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={avatarSrc(pub.author, pub.alumniProfile, pub.authorName)}
                alt={getAuthorDisplayName(pub)}
                className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-neutral-700 shrink-0"
              />
              <span className="truncate text-gray-700 dark:text-neutral-200 font-bold text-xs">
                {getAuthorDisplayName(pub)}
              </span>
              {pub.alumniProfile && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                  Alumni
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-gray-400 shrink-0">
              <LocalInteractionButton 
                icon={Heart} 
                count={engagement.likeCount} 
                active={engagement.hasLiked}
                disabled={engagement.pendingInteraction !== null}
                activeColor="text-red-500" 
                onInteract={engagement.toggleLike}
              />
              <span className="flex items-center gap-1.5">
                <MessageCircle size={12} strokeWidth={1.5} className="text-gray-400" />
                <span className="font-medium text-gray-600 dark:text-neutral-300">{pub._count.comments}</span>
              </span>
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
        active ? "text-white" : "text-gray-500 hover:text-black hover:bg-gray-100/50"
      )}
    >
      {active && (
        <motion.div
          layoutId="pub-active-tab"
          className="absolute inset-0 bg-black rounded-full shadow-sm"
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

function PublicationWrapper({ pub, view }: { pub: PublicationItem; view: ViewMode }) {
  const engagement = usePreviewInteractions({
    slug: pub.slug,
    initialLikeCount: pub._count.interactions,
    initialLiked: pub.hasLiked,
    initialBookmarked: pub.hasBookmarked
  });

  return <UnifiedPublicationItem pub={pub} engagement={engagement} view={view} />;
}

// ─── Exported ViewToggle ──────────────────────────────────────────────────

export function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="flex p-1 bg-gray-50 rounded-full w-fit border border-gray-200/50 gap-0.5">
      <LayoutGroup id="collection-view-toggle-standalone">
        <Tab active={view === "list"} onClick={() => onChange("list")} icon={List} label="List" />
        <Tab active={view === "card"} onClick={() => onChange("card")} icon={LayoutGrid} label="Grid" />
      </LayoutGroup>
    </div>
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
  const view = controlledView ?? internalView;
  const setView = onViewChange ?? setInternalView;

  return (
    <div className="w-full font-sans">
      <div className="flex flex-col gap-6">

        {/* View toggle (only if not externally controlled) */}
        {!controlledView && (
          <>
            <div className="flex p-1 bg-gray-50 rounded-full w-fit border border-gray-200/50 gap-0.5">
              <LayoutGroup id="collection-view-toggle">
                <Tab active={view === "list"} onClick={() => setView("list")} icon={List} label="List" />
                <Tab active={view === "card"} onClick={() => setView("card")} icon={LayoutGrid} label="Grid" />
              </LayoutGroup>
            </div>
            <div className="h-px bg-gray-100 w-full" />
          </>
        )}

        {/* Content */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            layout
            className={cn(
              "w-full",
              view === "list" && "flex flex-col gap-6",
              view === "card" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            )}
          >
            {publications.map((pub) =>
              <PublicationWrapper key={pub.id} pub={pub} view={view} />
            )}
          </motion.div>
        </AnimatePresence>

        {publications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl"
          >
            <p className="text-lg text-gray-500 font-serif">No publications found</p>
            <p className="text-sm text-gray-400 mt-1">Try shifting filters or clearing your search term.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
