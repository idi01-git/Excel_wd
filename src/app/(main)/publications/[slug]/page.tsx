// src/app/(main)/publications/[slug]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CommentThread from '@/components/discussion/CommentThread';
import CommentInput from '@/components/discussion/CommentInput';
import { InteractionButton } from '@/components/ui/interaction-button';
import ShareButton from '@/components/social/ShareButton';
import { Heart, ThumbsDown, Bookmark, ListFilter, ArrowLeft } from 'lucide-react';
import { LoginPromptModal } from '@/components/auth/LoginPromptModal';
import { Toast } from '@/components/ui/Toast';
import { useOptimisticInteract } from '@/hooks/useOptimisticInteract';

interface Publication {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  category: string;
  tags: string[];
  readingTime: number;
  createdAt: string;
  content: any;
  authorId: string;
  authorName?: string | null;
  authorNote?: string | null;
  alumniProfileId?: string | null;
  author: {
    id: string;
    name: string;
    username: string;
    profilePhoto?: string | null;
    bio?: string | null;
  };
  alumniProfile?: {
    id: string;
    name: string;
    batch: string;
    branch: string;
    photo?: string | null;
  } | null;
}

// Custom TipTap JSON to React Node Serializer
function renderTipTapJSON(node: any, index: number = 0): React.ReactNode {
  if (!node) return null;

  const children = node.content 
    ? node.content.map((child: any, idx: number) => renderTipTapJSON(child, idx)) 
    : null;

  switch (node.type) {
    case 'doc':
      return <div key={index} className="prose dark:prose-invert max-w-none">{children}</div>;
    
    case 'paragraph':
      return (
        <p key={index} className="text-neutral-800 dark:text-neutral-200 font-sans text-base md:text-lg leading-relaxed mb-6">
          {children}
        </p>
      );
    
    case 'heading':
      const level = node.attrs?.level || 2;
      if (level === 1) {
        return <h1 key={index} className="text-3xl font-sans text-neutral-950 dark:text-neutral-50 font-bold mt-8 mb-4">{children}</h1>;
      } else if (level === 2) {
        return <h2 key={index} className="text-2xl font-sans text-neutral-950 dark:text-neutral-50 font-bold mt-10 mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">{children}</h2>;
      } else {
        return <h3 key={index} className="text-xl font-sans text-neutral-950 dark:text-neutral-50 font-bold mt-6 mb-3">{children}</h3>;
      }
    
    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-4 border-neutral-900 dark:border-neutral-100 bg-neutral-100/70 dark:bg-neutral-900/70 px-5 py-3.5 my-6 rounded-r-xl font-serif italic text-neutral-700 dark:text-neutral-300">
          {children}
        </blockquote>
      );
    
    case 'bulletList':
      return <ul key={index} className="list-disc pl-6 mb-6 space-y-2 text-neutral-800 dark:text-neutral-200">{children}</ul>;
    
    case 'orderedList':
      return <ol key={index} className="list-decimal pl-6 mb-6 space-y-2 text-neutral-800 dark:text-neutral-200">{children}</ol>;
    
    case 'listItem':
      return <li key={index}>{children}</li>;
    
    case 'horizontalRule':
      return <hr key={index} className="border-neutral-200 dark:border-neutral-800 my-8" />;
    
    case 'image':
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || 'Inline image'}
          className="max-w-full h-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 my-8 mx-auto shadow-sm"
        />
      );
    
    case 'text':
      let element: React.ReactNode = node.text;

      if (node.marks && Array.isArray(node.marks)) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') {
            element = <strong key={mark.type} className="text-neutral-950 dark:text-white font-bold">{element}</strong>;
          } else if (mark.type === 'italic') {
            element = <em key={mark.type}>{element}</em>;
          } else if (mark.type === 'strike') {
            element = <s key={mark.type}>{element}</s>;
          } else if (mark.type === 'underline') {
            element = <u key={mark.type}>{element}</u>;
          } else if (mark.type === 'link') {
            element = (
              <a
                key={mark.type}
                href={mark.attrs?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {element}
              </a>
            );
          }
        }
      }
      return element;

    default:
      return null;
  }
}

export default function PublicationDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [pub, setPub] = useState<Publication | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [initialStats, setInitialStats] = useState({ likes: 0, dislikes: 0, bookmarks: 0 });
  const [initialUserState, setInitialUserState] = useState({ liked: false, disliked: false, bookmarked: false });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [commentsSort, setCommentsSort] = useState<string>('new');
  const [sortDropdownOpen, setSortDropdownOpen] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const { state: userState, counts: stats, interact: optimisticInteract, error: interactionError, clearError } = useOptimisticInteract(
    pub?.slug || '',
    { ...initialUserState, counts: initialStats },
    () => setShowLoginModal(true)
  );

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/publications/${slug}`);
      const data = await res.json();
      if (data.success) {
        setPub(data.publication);
        setInitialStats(data.stats);
        setInitialUserState(data.userState);
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Fetch publication detail failed:', error);
    }
  };

  const fetchComments = async () => {
    if (!pub) return;
    try {
      const res = await fetch(`/api/publications/${pub.id}/comments?sort=${commentsSort}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Fetch comments failed:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDetail();
  }, [slug]);

  // Load comments when pub finishes loading
  useEffect(() => {
    if (pub) {
      fetchComments();
      setLoading(false);
    }
  }, [pub, commentsSort]);

  const handleInteraction = (type: 'LIKE' | 'DISLIKE' | 'BOOKMARK') => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    optimisticInteract(type);
  };

  const handlePostComment = async (content: string) => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    if (!pub) return;
    try {
      const res = await fetch(`/api/publications/${pub.id}/comments`, {
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
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    if (!pub) return;
    try {
      const res = await fetch(`/api/publications/${pub.id}/comments`, {
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
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
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
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
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

  if (loading || !pub) {
    return (
      <div className="max-w-3xl mx-auto py-16 animate-pulse px-4">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-3/4 mb-4"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-1/4 mb-10"></div>
        <div className="h-96 bg-neutral-200 dark:bg-neutral-800 rounded-2xl mb-8"></div>
        <div className="space-y-4">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-full"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-full"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto py-8 px-4 text-foreground">
      {/* Back to Publications */}
      <Link 
        href="/publications" 
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
        <span>Back to Publications</span>
      </Link>

      {/* Header */}
      <header className="mb-8">
        {pub.coverImage && (
          <div 
            className="relative w-full h-80 rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 shadow-sm mb-6"
            style={{
              maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
            }}
          >
            <img
              src={pub.coverImage}
              alt={pub.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          <span>{pub.category}</span>
          <span>&middot;</span>
          <span>{pub.readingTime} min read</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-neutral-950 dark:text-neutral-50 font-bold leading-tight mb-6">
          {pub.title}
        </h1>

        {/* Author Byline Row */}
        <div className="flex items-center justify-between py-4 border-y border-neutral-200/80 dark:border-neutral-800 mb-8">
          <div className="flex items-center gap-3">
            {/* Case 1: Linked to an Archivum Alumnorum Profile */}
            {pub.alumniProfile ? (
              <>
                <Link href={`/community/alumni?id=${pub.alumniProfile.id}`} className="shrink-0 group">
                  <img
                    src={
                      pub.alumniProfile.photo && pub.alumniProfile.photo.trim() !== ''
                        ? pub.alumniProfile.photo
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${pub.authorName || pub.alumniProfile.name}`
                    }
                    alt={pub.authorName || pub.alumniProfile.name}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-950 dark:group-hover:border-neutral-100 transition-colors"
                  />
                </Link>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/community/alumni?id=${pub.alumniProfile.id}`}
                      className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:underline transition-colors"
                    >
                      {pub.authorName || pub.alumniProfile.name}
                    </Link>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Alumni · Class of {pub.alumniProfile.batch}
                    </span>
                  </div>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    {pub.authorNote ? `${pub.authorNote} · ` : ''}
                    Published on{' '}
                    {new Date(pub.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </>
            ) : pub.authorName ? (
              /* Case 2: Custom Byline (no user account or archivum card linked) */
              <>
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300 font-serif shrink-0">
                  {pub.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {pub.authorName}
                    </span>
                    {pub.authorNote && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                        {pub.authorNote}
                      </span>
                    )}
                  </div>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Published on{' '}
                    {new Date(pub.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </>
            ) : (
              /* Case 3: Linked to standard Excelsior Account */
              <>
                <Link href={`/profile/${pub.author.username}`} className="shrink-0 group">
                  <img
                    src={
                      pub.author.profilePhoto && pub.author.profilePhoto.trim() !== ''
                        ? pub.author.profilePhoto
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${pub.author.name}`
                    }
                    alt={pub.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-950 dark:group-hover:border-neutral-100 transition-colors"
                  />
                </Link>
                <div>
                  <Link
                    href={`/profile/${pub.author.username}`}
                    className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:underline transition-colors"
                  >
                    {pub.author.name}
                  </Link>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Published on{' '}
                    {new Date(pub.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content Body */}
      <div className="font-serif text-lg leading-relaxed text-neutral-800 dark:text-neutral-200 mb-12">
        {renderTipTapJSON(pub.content)}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-8 mb-6 pb-6 border-b border-neutral-200/80 dark:border-neutral-800">
        {pub.tags.map((t) => (
          <span key={t} className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 px-3.5 py-1.5 rounded-full">
            #{t}
          </span>
        ))}
      </div>

      {/* Article Footer & Interactions */}
      <div className="flex flex-col gap-10 mb-12">
        <div className="flex items-center text-muted-foreground gap-2">
          <div className="flex items-center bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-full px-2 py-1">
            <InteractionButton
              icon={Heart}
              active={userState.liked}
              onClick={() => handleInteraction('LIKE')}
              activeColor="text-red-500"
              count={stats.likes}
              withConfetti
              size={20}
              className="py-1.5 px-3 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60"
              textClassName="text-sm"
            />
            
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
            
            <InteractionButton
              icon={ThumbsDown}
              active={userState.disliked}
              onClick={() => handleInteraction('DISLIKE')}
              activeColor="text-blue-500 dark:text-blue-400"
              size={20}
              className="py-1.5 px-3 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60"
            />
          </div>

          <InteractionButton
            icon={Bookmark}
            active={userState.bookmarked}
            onClick={() => handleInteraction('BOOKMARK')}
            activeColor="text-yellow-500 dark:text-amber-400"
            size={20}
            className="p-2 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          />

          <ShareButton 
            title={pub.title} 
            authorName={pub.authorName || pub.author?.name}
            authorPhoto={pub.alumniProfile?.photo || pub.author?.profilePhoto}
            category={pub.category}
            coverImage={pub.coverImage}
            readingTime={pub.readingTime}
            url={typeof window !== 'undefined' ? window.location.href : ''}
            className="p-2 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground"
          />
        </div>
      </div>

      {/* Discussion & Comments Section */}
      <section className="mt-16 pt-8 border-t border-neutral-200/80 dark:border-neutral-800">
        <h3 className="font-serif text-2xl font-bold mb-6 text-foreground">Discussion</h3>
        
        {/* Comment Input Card */}
        <div className="mb-10">
          <CommentInput 
            onSubmit={handlePostComment} 
            placeholder={session?.user ? "Contribute your thoughts to this piece..." : "Sign in to join the discussion..."}
            submitLabel="Post Comment"
          />
        </div>

        {/* Comment Sort Selector */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-neutral-200 dark:border-neutral-800 relative">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Comments ({comments.length})</span>
          <div className="relative">
            <button 
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 transition cursor-pointer select-none"
            >
              <ListFilter size={15} />
              Sort by
            </button>
            {sortDropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg py-1 w-32 z-20">
                <button
                  onClick={() => { setCommentsSort('new'); setSortDropdownOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer ${commentsSort === 'new' ? 'font-bold text-neutral-950 dark:text-white bg-neutral-100/60 dark:bg-neutral-800/60' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  Newest
                </button>
                <button
                  onClick={() => { setCommentsSort('top'); setSortDropdownOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer ${commentsSort === 'top' ? 'font-bold text-neutral-950 dark:text-white bg-neutral-100/60 dark:bg-neutral-800/60' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  Top Upvoted
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recursive Comment Tree lists */}
        <div className="flex flex-col gap-6">
          {comments.length > 0 ? (
            comments.map((comm) => (
              <CommentThread
                key={comm.id}
                comment={comm}
                postAuthorId={pub.authorId}
                onUpvote={handleUpvoteComment}
                onDownvote={handleDownvoteComment}
                onReply={handleReplyComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            ))
          ) : (
            <p className="text-center text-sm text-neutral-400 dark:text-neutral-500 italic py-6">No comments posted yet. Start the thread!</p>
          )}
        </div>
      </section>

      {/* Luxury Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action="interact with this publication"
      />
      <Toast message={interactionError} onClose={clearError} />
    </article>
  );
}
