// src/app/(workspace)/workspace/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  PenLine,
  Feather,
  Newspaper,
  PenTool,
  BookMarked,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Timer,
  AlertCircle,
  LayoutGrid,
  List,
  FileText,
} from 'lucide-react';

interface Publication {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  updatedAt: string;
  rejectionNote?: string | null;
}

const STATUS_TABS = [
  { key: 'DRAFT',     label: 'Drafts',           icon: FileText },
  { key: 'PENDING',   label: 'Pending Review',   icon: Timer },
  { key: 'PUBLISHED', label: 'Published',        icon: CheckCircle2 },
  { key: 'REJECTED',  label: 'Revision Requests', icon: AlertCircle },
];

function categoryIcon(category: string) {
  switch (category.toUpperCase()) {
    case 'POEM':   return Feather;
    case 'STORY':  return PenTool;
    case 'REVIEW': return BookMarked;
    default:       return Newspaper;
  }
}

function categoryLabel(category: string) {
  const map: Record<string, string> = {
    ARTICLE: 'Article', STORY: 'Story', POEM: 'Poem', REVIEW: 'Review',
  };
  return map[category.toUpperCase()] ?? category;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function WorkspaceDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('DRAFT');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchWorkspaceItems = async () => {
      try {
        const res = await fetch('/api/workspace/drafts');
        const data = await res.json();
        if (data.success) setPubs(data.publications);
      } catch (error) {
        console.error('Failed to load workspace items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaceItems();
  }, []);

  const handleCreateDraft = async () => {
    try {
      const res = await fetch('/api/workspace/drafts', { method: 'POST' });
      const data = await res.json();
      if (data.success) router.push(`/workspace/editor/${data.id}`);
    } catch (error) {
      console.error('Failed to create draft:', error);
    }
  };

  const drafts    = pubs.filter(p => p.status === 'DRAFT');
  const pending   = pubs.filter(p => p.status === 'PENDING');
  const published = pubs.filter(p => p.status === 'PUBLISHED');
  const rejected  = pubs.filter(p => p.status === 'REJECTED');

  const countByTab: Record<string, number> = {
    DRAFT: drafts.length,
    PENDING: pending.length,
    PUBLISHED: published.length,
    REJECTED: rejected.length,
  };

  const activeList = (() => {
    if (activeTab === 'DRAFT')     return drafts;
    if (activeTab === 'PENDING')   return pending;
    if (activeTab === 'PUBLISHED') return published;
    return rejected;
  })();

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 animate-pulse space-y-8">
        <div className="h-12 bg-gray-100 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(n => <div key={n} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3].map(n => <div key={n} className="h-16 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 dark:border-neutral-800 pb-8">
        <div>
          <p className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-bold mb-2">
            Writer Workspace
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-black dark:text-white font-bold tracking-tight leading-tight">
            {session?.user?.name ? `${session.user.name}'s Desk` : 'My Desk'}
          </h1>
          <p className="text-gray-500 dark:text-neutral-400 text-sm mt-2">
            Draft new pieces, review editorial notes, and submit creations for review.
          </p>
        </div>
        <button
          onClick={handleCreateDraft}
          className="inline-flex items-center gap-2 self-start md:self-end px-6 py-3 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-sm rounded-full transition-all duration-200 shadow-sm shrink-0"
        >
          <PenLine size={14} />
          Write New Piece
        </button>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
        {[
          { label: 'Total Submissions', value: pubs.length,     color: 'text-black dark:text-white',           icon: FileText,   gradient: 'from-gray-50/80 to-white dark:from-neutral-900 dark:to-neutral-950/50' },
          { label: 'Published Works',  value: published.length, color: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, gradient: 'from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-neutral-950/50' },
          { label: 'Awaiting Review',  value: pending.length,   color: 'text-amber-700 dark:text-amber-400',     icon: Timer,      gradient: 'from-amber-50/50 to-white dark:from-amber-950/20 dark:to-neutral-950/50' },
          { label: 'Revision Requests', value: rejected.length, color: 'text-red-700 dark:text-red-400',         icon: AlertCircle, gradient: 'from-red-50/50 to-white dark:from-red-950/20 dark:to-neutral-950/50' },
        ].map(stat => (
          <div
            key={stat.label}
            className={`group relative overflow-hidden flex flex-col p-6 rounded-3xl border border-gray-200/60 dark:border-neutral-800 bg-gradient-to-br ${stat.gradient} shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] hover:-translate-y-0.5`}
          >
            {/* Background Watermark Icon */}
            <stat.icon 
              className={`absolute -right-4 -bottom-4 w-28 h-28 ${stat.color} opacity-[0.04] dark:opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6`} 
              strokeWidth={1} 
            />
            
            <div className="relative z-10 flex flex-col h-full">
              <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-6">
                {stat.label}
              </span>
              <span className={`text-4xl md:text-5xl font-bold font-serif tracking-tight leading-none mt-auto ${stat.color}`}>
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status Tabs ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-8 border-b border-gray-100 dark:border-neutral-800 pb-5">
        <div className="flex flex-wrap gap-1.5 bg-gray-50 dark:bg-neutral-900 p-1 border border-gray-200/50 dark:border-neutral-800 rounded-full">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative py-1.5 px-4 rounded-full text-xs font-semibold tracking-wide transition-all outline-none ${
                activeTab === key
                  ? 'text-white dark:text-black'
                  : 'text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50'
              }`}
            >
              {activeTab === key && (
                <motion.div
                  layoutId="workspace-active-tab"
                  className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 1 }}
                />
              )}
              <span className="relative z-10">
                {label}
                <span className="ml-1.5 opacity-60">({countByTab[key]})</span>
              </span>
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex p-1 bg-gray-50 dark:bg-neutral-900 rounded-full w-fit border border-gray-200/50 dark:border-neutral-800 gap-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`relative flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all rounded-full outline-none ${
              viewMode === 'list' ? 'text-white dark:text-black' : 'text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            {viewMode === 'list' && (
              <motion.div
                layoutId="workspace-view-tab"
                className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 1 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <List size={14} strokeWidth={1.8} className={viewMode === 'list' ? 'scale-110' : ''} />
              List
            </span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`relative flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all rounded-full outline-none ${
              viewMode === 'grid' ? 'text-white dark:text-black' : 'text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            {viewMode === 'grid' && (
              <motion.div
                layoutId="workspace-view-tab"
                className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 1 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <LayoutGrid size={14} strokeWidth={1.8} className={viewMode === 'grid' ? 'scale-110' : ''} />
              Grid
            </span>
          </button>
        </div>
      </div>

      {/* ── Publication List ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeList.length > 0 ? (
          <motion.div 
            key={`list-container-${viewMode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-2"}
          >
            {activeList.map((p, i) => {
              const Icon = categoryIcon(p.category);
              
              if (viewMode === 'list') {
                return (
                  <div
                    key={p.id}
                    className="relative flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-900/60 transition-colors duration-200 group border border-transparent dark:border-transparent"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400">
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-1 items-center justify-between min-w-0 gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-black dark:text-white leading-snug truncate">
                          {p.title || 'Untitled Draft'}
                        </h3>
                        {p.status === 'REJECTED' && p.rejectionNote && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 truncate max-w-sm">
                            <AlertCircle size={10} className="inline mr-1" />
                            Editor: "{p.rejectionNote}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2 py-0.5 rounded-full">
                            {categoryLabel(p.category)}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-neutral-500">
                            <Clock size={10} strokeWidth={1.5} />
                            {formatDate(p.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {p.status === 'PUBLISHED' ? (
                          <Link
                            href={`/publications/${p.slug}`}
                            className="inline-flex items-center gap-1.5 py-1.5 px-4 border border-gray-200 dark:border-neutral-700 text-black dark:text-white text-xs font-semibold rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                          >
                            View Live
                            <ArrowUpRight size={11} strokeWidth={2.5} />
                          </Link>
                        ) : (
                          <Link
                            href={`/workspace/editor/${p.id}`}
                            className="inline-flex items-center gap-1.5 py-1.5 px-4 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-full hover:bg-gray-900 dark:hover:bg-neutral-100 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            {p.status === 'REJECTED' ? 'Revise' : 'Edit'}
                            <PenLine size={11} strokeWidth={2.5} />
                          </Link>
                        )}
                      </div>
                    </div>
                    {i < activeList.length - 1 && (
                      <div className="absolute bottom-0 left-16 right-4 h-px bg-gray-100 dark:bg-neutral-800" />
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={p.id}
                  className="relative flex flex-col w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Top section with badge and icon */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-neutral-300">
                        <Icon size={18} strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2.5 py-1 rounded-full">
                        {categoryLabel(p.category)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-black dark:text-white leading-tight font-serif mb-2 line-clamp-2">
                      {p.title || 'Untitled Draft'}
                    </h3>

                    {p.status === 'REJECTED' && p.rejectionNote && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium line-clamp-3">
                          <AlertCircle size={12} className="inline mr-1 -mt-0.5" />
                          {p.rejectionNote}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-neutral-500 mt-auto pt-4">
                      <Clock size={12} strokeWidth={1.5} />
                      Last edited {formatDate(p.updatedAt)}
                    </div>
                  </div>

                  {/* Bottom action bar */}
                  <div className="border-t border-gray-100 dark:border-neutral-800 p-3 bg-gray-50 dark:bg-neutral-900/50 flex justify-end">
                    {p.status === 'PUBLISHED' ? (
                      <Link
                        href={`/publications/${p.slug}`}
                        className="inline-flex items-center gap-1.5 py-1.5 px-4 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white text-xs font-semibold rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 w-full justify-center"
                      >
                        View Live
                        <ArrowUpRight size={12} strokeWidth={2.5} />
                      </Link>
                    ) : (
                      <Link
                        href={`/workspace/editor/${p.id}`}
                        className="inline-flex items-center gap-1.5 py-1.5 px-4 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-neutral-200 transition-all duration-200 w-full justify-center"
                      >
                        {p.status === 'REJECTED' ? 'Revise Draft' : 'Edit Draft'}
                        <PenLine size={12} strokeWidth={2.5} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-2xl"
          >
            <p className="font-serif text-xl text-gray-500 dark:text-neutral-400">
              Nothing here yet.
            </p>
            <p className="text-sm text-gray-400 dark:text-neutral-500 mt-1">
              {activeTab === 'DRAFT'
                ? 'Click "Write New Piece" to start your first draft.'
                : `No ${activeTab.toLowerCase()} submissions to show.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
