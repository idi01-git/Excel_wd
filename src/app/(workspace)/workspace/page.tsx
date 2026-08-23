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
  Trash2,
  Edit,
  Loader2,
  XCircle,
} from 'lucide-react';
import { FadeUp } from '@/components/home/primitives';
import { hasPermission } from '@/lib/rbac';

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
  if (isNaN(date.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export default function WorkspaceDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('DRAFT');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemToDelete, setItemToDelete] = useState<Publication | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canModerate = hasPermission(session?.user?.role, 'MODERATE_PUBLICATIONS');

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

  const confirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspace/editor/${itemToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPubs((prev) => prev.filter((p) => p.id !== itemToDelete.id));
        setItemToDelete(null);
        setToast({ message: 'Publication deleted successfully.', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to delete publication.', type: 'error' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setToast({ message: 'An error occurred while deleting.', type: 'error' });
    } finally {
      setIsDeleting(false);
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

  const activeList = pubs.filter(p => p.status === activeTab);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 animate-pulse space-y-8">
        <div className="h-12 bg-gray-100 dark:bg-neutral-800 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(n => <div key={n} className="h-24 bg-gray-100 dark:bg-neutral-800 rounded-3xl" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3].map(n => <div key={n} className="h-16 bg-gray-100 dark:bg-neutral-800 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 text-black dark:text-white">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <FadeUp delay={0.04} y={16}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12 border-b border-gray-200/80 dark:border-neutral-800 pb-8 sm:pb-10">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest block mb-2 sm:mb-3">
              Editorial Studio
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif tracking-tight text-black dark:text-white leading-tight">
              Author Workspace
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
              Craft, refine, and track the journey of your written publications.
            </p>
          </div>
          <motion.button
            onClick={handleCreateDraft}
            whileHover={{ scale: 1.04, y: -1.5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.18)" }}
            whileTap={{ scale: 0.96, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.5 }}
            className="inline-flex items-center gap-2 self-start md:self-end px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs sm:text-sm rounded-full shadow-sm shrink-0 cursor-pointer"
          >
            <PenLine size={14} />
            Write New Piece
          </motion.button>
        </div>
      </FadeUp>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 md:gap-6 mb-10 sm:mb-12">
        {[
          { label: 'Total Submissions', value: pubs.length,     color: 'text-black dark:text-white',           icon: FileText,   gradient: 'from-gray-50/80 to-white dark:from-neutral-900 dark:to-neutral-950/50', delay: 0.08 },
          { label: 'Published Works',  value: published.length, color: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, gradient: 'from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-neutral-950/50', delay: 0.12 },
          { label: 'Awaiting Review',  value: pending.length,   color: 'text-amber-700 dark:text-amber-400',     icon: Timer,      gradient: 'from-amber-50/50 to-white dark:from-amber-950/20 dark:to-neutral-950/50', delay: 0.16 },
          { label: 'Revision Requests', value: rejected.length, color: 'text-red-700 dark:text-red-400',         icon: AlertCircle, gradient: 'from-red-50/50 to-white dark:from-red-950/20 dark:to-neutral-950/50', delay: 0.20 },
        ].map(stat => (
          <FadeUp key={stat.label} delay={stat.delay} y={16}>
            <motion.div
              whileHover={{ y: -4, scale: 1.015, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.08)" }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 0.8 }}
              className={`group relative overflow-hidden flex flex-col p-5 sm:p-6 rounded-3xl border border-gray-200/60 dark:border-neutral-800 bg-gradient-to-br ${stat.gradient} shadow-[0_2px_10px_rgb(0,0,0,0.02)] h-full`}
            >
              <stat.icon 
                className={`absolute -right-4 -bottom-4 w-24 sm:w-28 h-24 sm:h-28 ${stat.color} opacity-[0.04] dark:opacity-[0.06] -rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6`} 
                strokeWidth={1} 
              />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-4 sm:mb-6">
                  {stat.label}
                </span>
                <span className={`text-3xl sm:text-4xl md:text-5xl font-bold font-serif tracking-tight leading-none mt-auto ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
            </motion.div>
          </FadeUp>
        ))}
      </div>

      {/* ── Status Tabs ────────────────────────────────────────────────────── */}
      <FadeUp delay={0.24} y={12}>
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-8 border-b border-gray-100 dark:border-neutral-800 pb-5">
          <div className="flex flex-wrap gap-1.5 bg-gray-50 dark:bg-neutral-900 p-1 border border-gray-200/50 dark:border-neutral-800 rounded-full">
            {STATUS_TABS.map(({ key, label }) => (
              <motion.button
                key={key}
                onClick={() => setActiveTab(key)}
                whileHover={{ scale: activeTab === key ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative py-1.5 px-3.5 sm:px-4 rounded-full text-xs font-semibold tracking-wide transition-colors outline-none cursor-pointer ${
                  activeTab === key
                    ? 'text-white dark:text-black'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50'
                }`}
              >
                {activeTab === key && (
                  <motion.div
                    layoutId="workspace-active-tab"
                    className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
                  />
                )}
                <span className="relative z-10">
                  {label}
                  <span className="ml-1.5 opacity-60">({countByTab[key]})</span>
                </span>
              </motion.button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex p-1 bg-gray-50 dark:bg-neutral-900 rounded-full w-fit border border-gray-200/50 dark:border-neutral-800 gap-0.5">
            <motion.button
              onClick={() => setViewMode('list')}
              whileHover={{ scale: viewMode === 'list' ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded-full outline-none cursor-pointer ${
                viewMode === 'list' ? 'text-white dark:text-black' : 'text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50'
              }`}
            >
              {viewMode === 'list' && (
                <motion.div
                  layoutId="workspace-view-tab"
                  className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                <List size={14} strokeWidth={1.8} className={viewMode === 'list' ? 'scale-110' : ''} />
                List
              </span>
            </motion.button>
            <motion.button
              onClick={() => setViewMode('grid')}
              whileHover={{ scale: viewMode === 'grid' ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded-full outline-none cursor-pointer ${
                viewMode === 'grid' ? 'text-white dark:text-black' : 'text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50'
              }`}
            >
              {viewMode === 'grid' && (
                <motion.div
                  layoutId="workspace-view-tab"
                  className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                <LayoutGrid size={14} strokeWidth={1.8} className={viewMode === 'grid' ? 'scale-110' : ''} />
                Grid
              </span>
            </motion.button>
          </div>
        </div>
      </FadeUp>

      {/* ── Publication List ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeList.length > 0 ? (
          <motion.div 
            key={`list-container-${viewMode}-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" : "flex flex-col gap-2.5 sm:gap-3"}
          >
            {activeList.map((p, i) => {
              const Icon = categoryIcon(p.category);
              
              if (viewMode === 'list') {
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2, scale: 1.005, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.08)" }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
                    key={p.id}
                    className="relative flex items-center gap-3.5 sm:gap-4 w-full p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/70 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors duration-200 group"
                  >
                    <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-gray-200/60 dark:border-neutral-700/60 flex items-center justify-center text-gray-500 dark:text-neutral-400">
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-1 items-center justify-between min-w-0 gap-4 flex-wrap sm:flex-nowrap">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white leading-snug truncate">
                          {p.title || 'Untitled Draft'}
                        </h3>
                        {p.status === 'REJECTED' && p.rejectionNote && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 truncate max-w-sm">
                            <AlertCircle size={10} className="inline mr-1" />
                            Editor: "{p.rejectionNote}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase bg-gray-100 dark:bg-neutral-800 border border-gray-200/60 dark:border-neutral-700/60 px-2 py-0.5 rounded-full">
                            {categoryLabel(p.category)}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400 dark:text-neutral-500">
                            <Clock size={10} strokeWidth={1.5} />
                            {formatDate(p.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {p.status === 'PUBLISHED' ? (
                          <>
                            <Link
                              href={`/publications/${p.slug}`}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 border border-gray-200 dark:border-neutral-700 text-black dark:text-white text-xs font-semibold rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-200 cursor-pointer"
                            >
                              <span>Live</span>
                              <ArrowUpRight size={11} strokeWidth={2.5} />
                            </Link>
                            {canModerate && (
                              <Link
                                href={`/workspace/editor/${p.id}`}
                                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-full hover:bg-gray-900 dark:hover:bg-neutral-100 transition-colors duration-200 cursor-pointer shadow-xs"
                              >
                                <span>Edit</span>
                                <PenLine size={11} strokeWidth={2.5} />
                              </Link>
                            )}
                          </>
                        ) : (
                          <Link
                            href={`/workspace/editor/${p.id}`}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-full hover:bg-gray-900 dark:hover:bg-neutral-100 transition-colors duration-200 cursor-pointer shadow-xs"
                          >
                            <span>{p.status === 'REJECTED' ? 'Revise' : 'Open'}</span>
                            <PenLine size={11} strokeWidth={2.5} />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setItemToDelete(p)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors cursor-pointer"
                          title="Delete publication"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.015, boxShadow: "0 16px 40px -10px rgba(0,0,0,0.08)" }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
                  key={p.id}
                  className="relative flex flex-col w-full rounded-2xl overflow-hidden border border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors duration-300 group"
                >
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-neutral-300">
                        <Icon size={18} strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2.5 py-1 rounded-full">
                        {categoryLabel(p.category)}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-black dark:text-white leading-tight font-serif mb-2 line-clamp-2">
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
                  <div className="border-t border-gray-100 dark:border-neutral-800 p-3 bg-gray-50/70 dark:bg-neutral-900/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {p.status === 'PUBLISHED' ? (
                        <>
                          <Link
                            href={`/publications/${p.slug}`}
                            className="inline-flex items-center justify-center gap-1 py-1.5 px-4 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-black dark:text-white text-xs font-semibold rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex-1 cursor-pointer"
                          >
                            <span>Live</span>
                            <ArrowUpRight size={11} strokeWidth={2.5} />
                          </Link>
                          {canModerate && (
                            <Link
                              href={`/workspace/editor/${p.id}`}
                              className="inline-flex items-center justify-center gap-1 py-1.5 px-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors flex-1 cursor-pointer"
                            >
                              <span>Edit Piece</span>
                              <PenLine size={11} strokeWidth={2.5} />
                            </Link>
                          )}
                        </>
                      ) : (
                        <Link
                          href={`/workspace/editor/${p.id}`}
                          className="inline-flex items-center justify-center gap-1 py-1.5 px-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors flex-1 cursor-pointer"
                        >
                          <span>{p.status === 'REJECTED' ? 'Revise' : 'Edit Draft'}</span>
                          <PenLine size={11} strokeWidth={2.5} />
                        </Link>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(p)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors cursor-pointer shrink-0"
                      title="Delete publication"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-3xl"
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setItemToDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl z-10"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
                <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-950 dark:text-neutral-50">
                  Delete Publication?
                </h3>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                Are you sure you want to delete <strong className="text-neutral-900 dark:text-neutral-100">"{itemToDelete.title || 'Untitled Draft'}"</strong>? This will permanently remove this piece and cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className={`p-4 rounded-xl shadow-xl border flex items-center gap-3 backdrop-blur-xl ${
                toast.type === 'success'
                  ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                  : 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span className="text-xs font-semibold">{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-2 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
