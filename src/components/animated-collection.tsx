"use client";

import { motion, AnimatePresence, type Transition } from "motion/react";
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

type ViewMode = "list" | "card";

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

function avatarSrc(author: PublicationItem["author"]) {
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
  const { slug, initialLikeCount, initialLiked = false, initialBookmarked = false } = params;
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialLiked);
  const [hasBookmarked, setHasBookmarked] = useState(initialBookmarked);
  const [pendingInteraction, setPendingInteraction] = useState<PreviewInteractionType | null>(null);
  const pendingRef = useRef(false);

  const toggleLike = async () => {
    if (pendingRef.current) return;

    pendingRef.current = true;
    setPendingInteraction('LIKE');

    const previousLikeCount = likeCount;
    const previousLiked = hasLiked;
    const nextLiked = !previousLiked;
    const nextLikeCount = Math.max(0, previousLikeCount + (nextLiked ? 1 : -1));

    setHasLiked(nextLiked);
    setLikeCount(nextLikeCount);

    try {
      const res = await fetch(`/api/publications/${slug}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'LIKE' })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error('Failed to update like');
      }

      setLikeCount(data.stats.likes);
      setHasLiked(data.active);
    } catch {
      setHasLiked(previousLiked);
      setLikeCount(previousLikeCount);
    } finally {
      pendingRef.current = false;
      setPendingInteraction(null);
    }
  };

  const toggleBookmark = async () => {
    if (pendingRef.current) return;

    pendingRef.current = true;
    setPendingInteraction('BOOKMARK');

    const previousBookmarked = hasBookmarked;
    const nextBookmarked = !previousBookmarked;

    setHasBookmarked(nextBookmarked);

    try {
      const res = await fetch(`/api/publications/${slug}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'BOOKMARK' })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error('Failed to update bookmark');
      }

      setHasBookmarked(data.active);
    } catch {
      setHasBookmarked(previousBookmarked);
    } finally {
      pendingRef.current = false;
      setPendingInteraction(null);
    }
  };

  return {
    likeCount,
    hasLiked,
    hasBookmarked,
    pendingInteraction,
    toggleLike,
    toggleBookmark
  };
}

function LocalInteractionButton({ icon, count, activeColor, withConfetti, withFill, active = false, disabled = false, onInteract }: {
  icon: React.ElementType;
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
        initial={{ opacity: 1 }}
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
                {categoryLabel(pub.category)} &middot; {pub.author.name}
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
              <span className={cn("flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border", categoryColor)}>
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

// ─── List item ────────────────────────────────────────────────────────────────

function ListItem({ pub }: { pub: PublicationItem }) {
  const [expanded, setExpanded] = useState(false);
  const engagement = usePreviewInteractions({
    slug: pub.slug,
    initialLikeCount: pub._count.interactions,
    initialLiked: pub.hasLiked,
    initialBookmarked: pub.hasBookmarked
  });

  const layoutId = `pub-list-${pub.id}`;
  const icon  = categoryIcon(pub.category);

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

      <motion.div
        layoutId={layoutId}
        onClick={() => setExpanded(true)}
        transition={smoothSpring}
        className="relative flex items-center gap-4 w-full p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors duration-200 group"
      >
        {/* Thumbnail */}
        <motion.div layoutId={`${layoutId}-img`} transition={smoothSpring} className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-200">
          <img
            src={coverSrc(pub)}
            alt={pub.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </motion.div>

        {/* Info */}
        <div className="flex flex-1 items-center justify-between min-w-0">
          <div className="flex flex-col gap-1 min-w-0">
            <motion.h3 layoutId={`${layoutId}-title`} transition={smoothSpring} className="text-sm font-semibold text-black leading-snug truncate group-hover:text-black transition-colors">
              {pub.title}
            </motion.h3>
            <motion.p layoutId={`${layoutId}-desc`} transition={smoothSpring} className="flex items-center gap-2 text-xs text-gray-500">
              {React.createElement(icon, { size: 11, strokeWidth: 1.8, className: "text-gray-400 shrink-0" })}
              <span className="truncate">{pub.author.name}</span>
              <span className="text-gray-400">&middot;</span>
              <span>{pub.readingTime} min</span>
            </motion.p>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            <span className={cn("hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border", categoryColor)}>
              {React.createElement(icon, { size: 9, strokeWidth: 2 })}
              {categoryLabel(pub.category)}
            </span>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
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
                <span className="font-medium">{pub._count.comments}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div className="absolute bottom-0 left-20 right-3 h-px bg-gray-100" />
      </motion.div>
    </>
  );
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function CardItem({ pub }: { pub: PublicationItem }) {
  const [expanded, setExpanded] = useState(false);
  const engagement = usePreviewInteractions({
    slug: pub.slug,
    initialLikeCount: pub._count.interactions,
    initialLiked: pub.hasLiked,
    initialBookmarked: pub.hasBookmarked
  });

  const layoutId = `pub-card-${pub.id}`;
  const icon  = categoryIcon(pub.category);

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

      <motion.div
        layoutId={layoutId}
        onClick={() => setExpanded(true)}
        transition={smoothSpring}
        className="relative flex flex-col w-full rounded-2xl overflow-hidden border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg cursor-pointer group transition-all duration-300"
      >
        {/* Cover */}
        <motion.div layoutId={`${layoutId}-img`} transition={smoothSpring} className="relative w-full aspect-[4/3] overflow-hidden border-b border-gray-200">
          <img
            src={coverSrc(pub)}
            alt={pub.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <span className={cn("absolute top-2.5 left-2.5 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-sm", categoryColor)}>
            {React.createElement(icon, { size: 9, strokeWidth: 2 })}
            {categoryLabel(pub.category)}
          </span>
        </motion.div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {pub.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
          <motion.h3 layoutId={`${layoutId}-title`} transition={smoothSpring} className="text-sm font-bold text-black leading-snug group-hover:text-black transition-colors line-clamp-2 font-serif">
            {pub.title}
          </motion.h3>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <img src={avatarSrc(pub.author)} alt={pub.author.name} className="w-5 h-5 rounded-full object-cover border border-gray-200" />
              <motion.p layoutId={`${layoutId}-desc`} transition={smoothSpring} className="text-[11px] text-gray-500 font-medium truncate max-w-[80px]">
                {pub.author.name}
              </motion.p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
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
                <span className="font-medium">{pub._count.comments}</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function Tab({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all rounded-full outline-none",
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

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PublicationCollection({ publications }: { publications: PublicationItem[] }) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="w-full font-sans">
      <div className="flex flex-col gap-6">

        {/* View toggle */}
        <div className="flex p-1 bg-gray-50 rounded-full w-fit border border-gray-200/50 gap-0.5">
          <Tab active={view === "list"} onClick={() => setView("list")} icon={List} label="List" />
          <Tab active={view === "card"} onClick={() => setView("card")} icon={LayoutGrid} label="Grid" />
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Content */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "w-full",
              view === "list" && "flex flex-col",
              view === "card" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            )}
          >
            {publications.map((pub) =>
              view === "list"
                ? <ListItem key={pub.id} pub={pub} />
                : <CardItem key={pub.id} pub={pub} />
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
