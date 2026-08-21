// src/app/(moderation)/moderator/pending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, Eye, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingPublication {
  id: string;
  title: string;
  category: string;
  coverImage?: string | null;
  updatedAt: string;
  content: any;
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
}

export default function ModeratorQueuePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [queue, setQueue] = useState<PendingPublication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/moderator/queue');
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
      }
    } catch (error) {
      console.error('Failed to load moderator queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
        <div className="py-12 animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 dark:bg-neutral-900/60 rounded-xl w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-100 dark:bg-neutral-900/60 rounded-lg w-1/2 mb-10"></div>
          <div className="h-24 bg-gray-100 dark:bg-neutral-900/60 rounded-2xl" />
          <div className="h-24 bg-gray-100 dark:bg-neutral-900/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
      {/* Back to Dashboard */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link 
          href="/profile" 
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-200 mb-6 py-1 px-3 -ml-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </Link>
      </motion.div>

      {/* Header section */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 border-b border-gray-200/80 dark:border-neutral-800 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <ShieldCheck size={16} />
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Moderation Desk
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-black dark:text-white font-bold leading-tight mb-2">
            Editorial Submissions Queue
          </h1>
          <p className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
            Evaluate pending submissions, write feedback, and approve publications.
          </p>
        </div>

        {queue.length > 0 && (
          <span className="shrink-0 text-xs font-mono font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 self-start sm:self-auto">
            {queue.length} Pending {queue.length === 1 ? 'Draft' : 'Drafts'}
          </span>
        )}
      </motion.div>

      {queue.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {queue.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
              >
                <Link
                  href={`/moderator/pending/${item.id}`}
                  className="block bg-white dark:bg-neutral-900/40 border border-gray-200/80 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      {item.coverImage ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-white/10 shrink-0 bg-neutral-100 dark:bg-neutral-800">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <BookOpen className="w-6 h-6 stroke-1.5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 border rounded-full font-bold uppercase tracking-widest bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30">
                            {item.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <h3 className="font-serif text-lg sm:text-xl text-gray-950 dark:text-white font-bold leading-snug truncate group-hover:text-violet-600 dark:group-hover:text-cyan-400 transition-colors duration-200 mb-1">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-600 dark:text-neutral-400">
                          <span>
                            By{' '}
                            <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">
                              {item.authorName || item.alumniProfile?.name || item.author.name}
                            </strong>
                            {(item.authorName || item.alumniProfile) ? ` (via @${item.author.username})` : ` (@${item.author.username})`}
                          </span>
                          {item.alumniProfile && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Alumni · Class of {item.alumniProfile.batch}
                            </span>
                          )}
                          {item.authorNote && !item.alumniProfile && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                              {item.authorNote}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-neutral-100/90 dark:bg-neutral-800/80 group-hover:bg-neutral-950 dark:group-hover:bg-white text-neutral-700 dark:text-neutral-300 group-hover:text-white dark:group-hover:text-neutral-950 border border-neutral-200/80 dark:border-neutral-700/80 group-hover:border-transparent rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-2xs group-hover:shadow-md cursor-pointer select-none"
                      >
                        <Eye className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                        <span>Review Draft</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </motion.span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-16 text-center bg-gray-50/50 dark:bg-neutral-900/20 border border-dashed border-gray-200/80 dark:border-neutral-800 rounded-3xl text-gray-400 dark:text-neutral-500 italic text-sm"
        >
          Inbox empty! All pending publications have been reviewed.
        </motion.div>
      )}
    </div>
  );
}
