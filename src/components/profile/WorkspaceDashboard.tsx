'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { PublicationStatus } from '@prisma/client';

interface WorkspaceItem {
  id: string;
  title: string;
  status: PublicationStatus;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

interface WorkspaceDashboardProps {
  drafts: WorkspaceItem[];
  pending: WorkspaceItem[];
}

export default function WorkspaceDashboard({ drafts, pending }: WorkspaceDashboardProps) {
  const [visibleDrafts, setVisibleDrafts] = useState(5);
  const [visiblePending, setVisiblePending] = useState(5);

  // Sort latest first (by createdAt or updatedAt descending)
  const sortedDrafts = [...drafts].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  const sortedPending = [...pending].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  const displayedDrafts = sortedDrafts.slice(0, visibleDrafts);
  const displayedPending = sortedPending.slice(0, visiblePending);

  const hasMoreDrafts = visibleDrafts < sortedDrafts.length;
  const hasMorePending = visiblePending < sortedPending.length;

  return (
    <section className="pt-8 sm:pt-12 border-t-2 border-dashed border-gray-200 dark:border-neutral-800">
      <h2 className="font-serif text-xl sm:text-2xl text-black dark:text-white font-bold mb-6 sm:mb-8">
        Workspace Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
        {/* Active Drafts Card */}
        <div className="bg-gray-50/50 dark:bg-neutral-900/30 p-4 sm:p-5 rounded-2xl border border-gray-200/60 dark:border-neutral-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-xs sm:text-sm font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest">
                Active Drafts
              </h3>
              <span className="bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {sortedDrafts.length}
              </span>
            </div>

            {sortedDrafts.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-y border-gray-100 dark:border-neutral-800">
                <AnimatePresence>
                  {displayedDrafts.map((d) => (
                    <motion.li
                      key={d.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="py-3.5 flex justify-between items-center gap-3 group"
                    >
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                          {d.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                            Draft
                          </span>
                          {d.status === PublicationStatus.REJECTED && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-700" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                                Changes Req
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/workspace/editor/${d.id}`}
                        className="shrink-0 p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                        title="Open in editor"
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="text-xs text-gray-400 dark:text-neutral-500 py-4 text-center">
                No active drafts found.
              </p>
            )}
          </div>

          {/* Load More Drafts Button */}
          {hasMoreDrafts && (
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleDrafts((prev) => prev + 5)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100/90 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Load More Drafts</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({sortedDrafts.length - visibleDrafts} remaining)
                </span>
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>

        {/* In Queue / Pending Reviews Card */}
        <div className="bg-gray-50/50 dark:bg-neutral-900/30 p-4 sm:p-5 rounded-2xl border border-gray-200/60 dark:border-neutral-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-xs sm:text-sm font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest">
                In Queue / Review
              </h3>
              <span className="bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {sortedPending.length}
              </span>
            </div>

            {sortedPending.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-y border-gray-100 dark:border-neutral-800">
                <AnimatePresence>
                  {displayedPending.map((p) => (
                    <motion.li
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="py-3.5 flex justify-between items-center gap-3"
                    >
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {p.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                            Under Review
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-neutral-500 shrink-0">
                        Awaiting Editor
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="text-xs text-gray-400 dark:text-neutral-500 py-4 text-center">
                No pending submissions.
              </p>
            )}
          </div>

          {/* Load More Pending Button */}
          {hasMorePending && (
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisiblePending((prev) => prev + 5)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100/90 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Load More Submissions</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({sortedPending.length - visiblePending} remaining)
                </span>
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
