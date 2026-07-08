// src/app/(moderation)/moderator/pending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Eye, BookOpen } from 'lucide-react';

interface PendingPublication {
  id: string;
  title: string;
  category: string;
  coverImage?: string | null;
  updatedAt: string;
  content: any;
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
          <div className="h-8 bg-gray-100 dark:bg-neutral-900/60 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-100 dark:bg-neutral-900/60 rounded w-1/2 mb-10"></div>
          <div className="h-20 bg-gray-100 dark:bg-neutral-900/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
      {/* Back to Dashboard */}
      <Link 
        href="/profile" 
        className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition flex items-center gap-1.5 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Header section */}
      <div className="mb-8 border-b border-gray-200/80 dark:border-neutral-800 pb-8">
        <h1 className="font-serif text-4xl text-black dark:text-white font-bold leading-tight mb-2">
          Editorial Submissions Queue
        </h1>
        <p className="text-gray-500 dark:text-neutral-500 text-sm font-medium">
          Evaluate pending submissions, write feedback, and approve publications.
        </p>
      </div>

      {queue.length > 0 ? (
        <div className="space-y-4">
          {queue.map((item) => (
            <Link
              key={item.id}
              href={`/moderator/pending/${item.id}`}
              className="block bg-white dark:bg-neutral-900/30 border border-gray-200/80 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden hover:border-gray-300 dark:hover:border-neutral-700 hover:bg-gray-50/50 dark:hover:bg-neutral-800/10 transition duration-300 group"
            >
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200/50 dark:border-white/5 shrink-0"
                    />
                  ) : (
                    <div className="p-3 bg-gray-100 dark:bg-neutral-800/50 rounded-xl text-gray-550 dark:text-neutral-450 shrink-0">
                      <BookOpen className="w-6 h-6 stroke-1.5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 border rounded-full font-bold uppercase tracking-widest bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30 mb-1.5">
                      {item.category}
                    </span>
                    <h3 className="font-serif text-xl text-gray-900 dark:text-white font-bold mb-1 leading-snug truncate group-hover:text-violet-600 dark:group-hover:text-cyan-400 transition">
                      {item.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-neutral-500 font-medium">
                      By {item.author.name} (@{item.author.username}) &middot; Updated {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className="inline-flex items-center gap-1 py-1.5 px-3.5 bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-350 border border-gray-200 dark:border-white/5 rounded-full font-bold text-[10px] uppercase tracking-wider group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition duration-200">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review Draft</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-gray-50/50 dark:bg-neutral-900/10 border border-gray-200/80 dark:border-neutral-800 rounded-2xl text-gray-400 dark:text-neutral-600 italic text-sm">
          Inbox empty! All pending publications have been reviewed.
        </div>
      )}
    </div>
  );
}
