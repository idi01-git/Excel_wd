// src/app/(main)/editors-shelf/[slug]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CommentThread from '@/components/discussion/CommentThread';
import CommentInput from '@/components/discussion/CommentInput';

interface ShelfItem {
  id: string;
  title: string;
  author: string;
  coverImage?: string | null;
  editorialNote: string;
  genre: string[];
  slug: string;
  createdAt: string;
}

export default function EditorsShelfDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [item, setItem] = useState<ShelfItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentsSort, setCommentsSort] = useState<string>('new');

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/editors-shelf/${slug}`);
      const data = await res.json();
      if (data.success) {
        setItem(data.item);
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Failed to load curated detail:', error);
    }
  };

  const fetchComments = async () => {
    if (!item) return;
    try {
      const res = await fetch(`/api/editors-shelf/${slug}/comments?sort=${commentsSort}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to load shelf comments:', error);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  useEffect(() => {
    if (item) {
      fetchComments();
      setLoading(false);
    }
  }, [item, commentsSort]);

  const handlePostComment = async (content: string) => {
    if (!item) return;
    try {
      const res = await fetch(`/api/editors-shelf/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleReplyComment = async (content: string, parentId: string) => {
    if (!item) return;
    try {
      const res = await fetch(`/api/editors-shelf/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId: parentId })
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to reply comment:', error);
    }
  };

  const handleUpvoteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/upvote`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to upvote comment:', error);
    }
  };

  const handleDownvoteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/downvote`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to downvote comment:', error);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (loading || !item) {
    return (
      <div className="max-w-3xl mx-auto py-16 animate-pulse">
        <div className="h-8 bg-gray-150 rounded-lg w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-150 rounded-lg w-1/4 mb-10"></div>
        <div className="h-96 bg-gray-150 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto py-8 text-black dark:text-white">
      {/* Back to Shelf */}
      <Link href="/editors-shelf" className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition flex items-center gap-1.5 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Editor's Shelf</span>
      </Link>

      {/* Header */}
      <header className="mb-8">
        {item.coverImage && (
          <div 
            className="relative w-full h-80 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-white/10 shadow-sm mb-6"
            style={{
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }}
          >
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.genre.map((g) => (
            <span key={g} className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              {g}
            </span>
          ))}
        </div>
        
        <h1 className="font-serif text-4xl text-black dark:text-white font-bold leading-tight mb-2">
          {item.title}
        </h1>
        <p className="text-gray-500 dark:text-neutral-500 text-sm mb-6">By {item.author}</p>
      </header>

      {/* Note Description */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8 font-serif text-lg leading-relaxed text-gray-800 mb-12 shadow-sm">
        <h3 className="font-sans text-xs uppercase tracking-wider text-gray-400 font-bold mb-4">Editorial Recommendation</h3>
        <p className="whitespace-pre-line">{item.editorialNote}</p>
      </div>

      {/* Discussion Area */}
      <section className="mt-12 pt-8 border-t border-gray-200/80">
        <h3 className="font-serif text-2xl text-black font-bold mb-4">Review Discussion</h3>
        
        {/* Comment input box */}
        <div className="mb-8">
          {session ? (
            <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-3">Commenting as <strong className="text-gray-700">@{session.user.username}</strong></p>
              <CommentInput onSubmit={handlePostComment} />
            </div>
          ) : (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center">
              <p className="text-gray-500 text-sm mb-4">Please register or log in to join the discussion.</p>
              <Link href="/login" className="inline-block py-2 px-6 bg-black hover:bg-gray-900 text-white text-xs font-bold rounded-full transition shadow-sm">
                Join to comment
              </Link>
            </div>
          )}
        </div>

        {/* Comment Sort Selector */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-250">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Comments ({comments.length})</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Sort:</span>
            <select
              value={commentsSort}
              onChange={(e) => setCommentsSort(e.target.value)}
              className="bg-white border border-gray-200 text-black text-xs rounded-full px-3 py-1 focus:outline-none cursor-pointer"
            >
              <option value="new">Newest</option>
              <option value="top">Top Upvoted</option>
            </select>
          </div>
        </div>

        {/* Comment thread tree */}
        <div className="flex flex-col gap-6">
          {comments.length > 0 ? (
            comments.map((comm) => (
              <CommentThread
                key={comm.id}
                comment={comm}
                postAuthorId="" // Shelf items do not have author users
                onUpvote={handleUpvoteComment}
                onDownvote={handleDownvoteComment}
                onReply={handleReplyComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            ))
          ) : (
            <p className="text-center text-sm text-gray-450 italic py-6">No discussion comments yet. Be the first to review!</p>
          )}
        </div>
      </section>
    </article>
  );
}
