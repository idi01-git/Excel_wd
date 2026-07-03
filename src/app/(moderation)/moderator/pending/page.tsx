// src/app/(moderation)/moderator/pending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

// Simple text extractor for previewing TipTap JSON
function getExcerptFromJSON(node: any): string {
  if (!node) return '';
  let text = '';
  if (node.type === 'text' && typeof node.text === 'string') {
    text += node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      text += getExcerptFromJSON(child) + ' ';
    }
  }
  return text.trim();
}

export default function ModeratorQueuePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [queue, setQueue] = useState<PendingPublication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

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

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    let note = '';
    if (action === 'REJECT') {
      const input = prompt('Please enter revision feedback notes for the author:');
      if (input === null) return; // cancel
      note = input.trim();
      if (!note) return alert('Feedback note is required to reject a submission.');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/moderator/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note })
      });
      const data = await res.json();
      if (data.success) {
        alert(action === 'APPROVE' ? 'Submission approved and published live!' : 'Submission rejected. Notes sent.');
        fetchQueue();
        setExpandedId(null);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to submit review decision:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 animate-pulse">
        <div className="h-8 bg-slate-900/60 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-slate-900/60 rounded w-1/2 mb-10"></div>
        <div className="h-60 bg-slate-900/60 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="border-b border-white/5 pb-6 mb-8">
        <h1 className="font-serif text-3xl text-white font-bold mb-1">Editorial Submissions Queue</h1>
        <p className="text-gray-400 text-sm">Evaluate pending submissions, write feedback, and approve publications.</p>
      </div>

      {queue.length > 0 ? (
        <div className="space-y-4">
          {queue.map((item) => {
            const isExpanded = expandedId === item.id;
            const excerpt = getExcerptFromJSON(item.content);

            return (
              <div
                key={item.id}
                className="bg-slate-900/40 border border-white/5 rounded-2xl shadow-xl overflow-hidden hover:border-white/10 transition duration-300"
              >
                {/* Collapsed view summary */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/2 transition duration-200"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.author.profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.author.username}`}
                      alt={item.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <span className="badge badge-accent text-[9px] mb-1">{item.category}</span>
                      <h3 className="font-serif text-lg text-white font-bold">{item.title}</h3>
                      <span className="text-xs text-gray-500">
                        By {item.author.name} (@{item.author.username}) &middot; Updated {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : item.id);
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:underline"
                    >
                      {isExpanded ? 'Collapse ↑' : 'Review Draft ↓'}
                    </button>
                  </div>
                </div>

                {/* Expanded content and actions */}
                {isExpanded && (
                  <div className="p-6 border-t border-white/5 bg-slate-950/20">
                    {item.coverImage && (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-xl border border-white/10 mb-6"
                      />
                    )}

                    <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap max-h-96 overflow-y-auto p-4 bg-slate-950/40 rounded-xl border border-white/5 font-serif">
                      {excerpt || <span className="italic text-gray-600">Draft has no text content.</span>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                      <button
                        onClick={() => handleReview(item.id, 'REJECT')}
                        disabled={submitting}
                        className="py-2 px-6 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/20 transition"
                      >
                        Reject & Request Revision
                      </button>
                      <button
                        onClick={() => handleReview(item.id, 'APPROVE')}
                        disabled={submitting}
                        className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 text-white text-xs font-semibold rounded-full transition"
                      >
                        Approve & Publish Live
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          Inbox empty! All pending publications have been reviewed.
        </div>
      )}
    </div>
  );
}
