// src/app/(main)/publications/[slug]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CommentThread from '@/components/discussion/CommentThread';
import CommentInput from '@/components/discussion/CommentInput';
import { InteractionButton } from '@/components/ui/interaction-button';
import { Heart, ThumbsDown, Bookmark, ListFilter } from 'lucide-react';

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
  author: {
    id: string;
    name: string;
    username: string;
    profilePhoto?: string | null;
    bio?: string | null;
  };
}

// Custom TipTap JSON to React Node Serializer
function renderTipTapJSON(node: any, index: number = 0): React.ReactNode {
  if (!node) return null;

  const children = node.content 
    ? node.content.map((child: any, idx: number) => renderTipTapJSON(child, idx)) 
    : null;

  switch (node.type) {
    case 'doc':
      return <div key={index} className="prose max-w-none">{children}</div>;
    
    case 'paragraph':
      return (
        <p key={index} className="text-gray-800 font-sans text-base md:text-lg leading-relaxed mb-6">
          {children}
        </p>
      );
    
    case 'heading':
      const level = node.attrs?.level || 2;
      if (level === 1) {
        return <h1 key={index} className="text-3xl font-sans text-black font-bold mt-8 mb-4">{children}</h1>;
      } else if (level === 2) {
        return <h2 key={index} className="text-2xl font-sans text-black font-bold mt-10 mb-4 border-b border-gray-150 pb-2">{children}</h2>;
      } else {
        return <h3 key={index} className="text-xl font-sans text-black font-bold mt-6 mb-3">{children}</h3>;
      }
    
    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-3 border-black bg-gray-50 px-5 py-3.5 my-6 rounded-r-xl font-serif italic text-gray-600">
          {children}
        </blockquote>
      );
    
    case 'bulletList':
      return <ul key={index} className="list-disc pl-6 mb-6 space-y-2 text-gray-800">{children}</ul>;
    
    case 'orderedList':
      return <ol key={index} className="list-decimal pl-6 mb-6 space-y-2 text-gray-800">{children}</ol>;
    
    case 'listItem':
      return <li key={index}>{children}</li>;
    
    case 'horizontalRule':
      return <hr key={index} className="border-gray-100 my-8" />;
    
    case 'image':
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || 'Inline image'}
          className="max-w-full h-auto rounded-2xl border border-gray-200 my-8 mx-auto shadow-sm"
        />
      );
    
    case 'text':
      let element: React.ReactNode = node.text;

      // Apply marks (bold, italic, strike, underline, link)
      if (node.marks && Array.isArray(node.marks)) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') {
            element = <strong key={mark.type}>{element}</strong>;
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
                className="text-[#0000ee] hover:underline"
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
  const [stats, setStats] = useState({ likes: 0, dislikes: 0, bookmarks: 0 });
  const [userState, setUserState] = useState({ liked: false, disliked: false, bookmarked: false });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [commentsSort, setCommentsSort] = useState<string>('new');
  const [sortDropdownOpen, setSortDropdownOpen] = useState<boolean>(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/publications/${slug}`);
      const data = await res.json();
      if (data.success) {
        setPub(data.publication);
        setStats(data.stats);
        setUserState(data.userState);
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

  const handleInteraction = async (type: 'LIKE' | 'DISLIKE' | 'BOOKMARK') => {
    if (!session) {
      router.push('/login');
      return;
    }

    const oldUserState = { ...userState };
    const oldStats = { ...stats };

    const nextState = { ...userState };
    const nextStats = { ...stats };

    if (type === 'LIKE') {
      nextState.liked = !userState.liked;
      nextStats.likes += nextState.liked ? 1 : -1;
      
      if (userState.disliked) {
        nextState.disliked = false;
        nextStats.dislikes -= 1;
      }
    } else if (type === 'DISLIKE') {
      nextState.disliked = !userState.disliked;
      nextStats.dislikes += nextState.disliked ? 1 : -1;
      
      if (userState.liked) {
        nextState.liked = false;
        nextStats.likes -= 1;
      }
    } else if (type === 'BOOKMARK') {
      nextState.bookmarked = !userState.bookmarked;
      nextStats.bookmarks += nextState.bookmarked ? 1 : -1;
    }

    setUserState(nextState);
    setStats(nextStats);

    try {
      const res = await fetch(`/api/publications/${pub?.id}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (!data.success) {
        setUserState(oldUserState);
        setStats(oldStats);
      } else {
        setStats(data.stats);
        setUserState({
          liked: type === 'LIKE' ? data.active : (type === 'DISLIKE' ? false : userState.liked),
          disliked: type === 'DISLIKE' ? data.active : (type === 'LIKE' ? false : userState.disliked),
          bookmarked: type === 'BOOKMARK' ? data.active : userState.bookmarked
        });
      }
    } catch (error) {
      setUserState(oldUserState);
      setStats(oldStats);
    }
  };

  const handlePostComment = async (content: string) => {
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

  if (loading || !pub) {
    return (
      <div className="max-w-3xl mx-auto py-16 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-100 rounded-lg w-1/4 mb-10"></div>
        <div className="h-96 bg-gray-100 rounded-2xl mb-8"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
          <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
          <div className="h-4 bg-gray-100 rounded-lg w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto py-8 text-black">
      {/* Header */}
      <header className="mb-8">
        {pub.coverImage && (
          <div 
            className="relative w-full h-80 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-white/10 shadow-sm mb-6"
            style={{
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }}
          >
            <img
              src={pub.coverImage}
              alt={pub.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
          <span>{pub.category}</span>
          <span>&middot;</span>
          <span>{pub.readingTime} min read</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-black dark:text-white font-bold leading-tight mb-6">
          {pub.title}
        </h1>

        {/* Author Bio Row */}
        <div className="flex items-center justify-between py-4 border-y border-gray-200/80 dark:border-neutral-800 mb-8">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${pub.author.username}`} className="shrink-0 group">
              <img
                src={pub.author.profilePhoto && pub.author.profilePhoto.trim() !== "" ? pub.author.profilePhoto : `https://api.dicebear.com/7.x/initials/svg?seed=${pub.author.name}`}
                alt={pub.author.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:border-black dark:group-hover:border-white transition-colors"
              />
            </Link>
            <div>
              <Link href={`/profile/${pub.author.username}`} className="block text-sm font-semibold text-black dark:text-white hover:underline hover:text-violet-600 dark:hover:text-cyan-400 transition-colors">
                {pub.author.name}
              </Link>
              <span className="block text-[11px] text-gray-400 dark:text-neutral-500">
                Published on {new Date(pub.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <div className="font-serif text-lg leading-relaxed text-gray-800 mb-12">
        {renderTipTapJSON(pub.content)}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-8 mb-6 pb-6 border-b border-gray-200/60">
        {pub.tags.map((t) => (
          <span key={t} className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full">
            #{t}
          </span>
        ))}
      </div>

      {/* Article Footer & Interactions (YouTube Style) */}
      <div className="flex flex-col gap-10 mb-12">
        <div className="flex items-center text-gray-500 gap-2">
          <div className="flex items-center bg-gray-50 border border-gray-200/60 rounded-full px-2 py-1">
            <InteractionButton
              icon={Heart}
              active={userState.liked}
              onClick={() => handleInteraction('LIKE')}
              activeColor="text-red-500"
              count={stats.likes}
              withConfetti
              size={20}
              className="py-1.5 px-3 rounded-full hover:bg-gray-100/50"
              textClassName="text-sm"
            />
            
            <div className="w-px h-5 bg-gray-200 mx-1" />
            
            <InteractionButton
              icon={ThumbsDown}
              active={userState.disliked}
              onClick={() => handleInteraction('DISLIKE')}
              activeColor="text-gray-900"
              size={20}
              withFill={true}
              fillColor="#cbd5e1"
              className="py-1.5 px-3 rounded-full hover:bg-gray-100/50"
              textClassName="text-sm"
            />
          </div>

          <div className="ml-auto">
            <InteractionButton
              icon={Bookmark}
              active={userState.bookmarked}
              onClick={() => handleInteraction('BOOKMARK')}
              activeColor="text-yellow-500"
              label={userState.bookmarked ? 'Saved' : 'Save'}
              withConfetti
              size={20}
              className="py-2 px-4 rounded-full bg-gray-50 border border-gray-200/60 hover:bg-gray-100/50"
              textClassName="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Unified Discussion Section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <h3 className="font-bold text-xl text-black">{comments.length} Comments</h3>
        </div>
        
        {/* Comment input box */}
        <div className="mb-10">
          {session ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="hidden sm:block">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                  <img 
                    src={
                      (session.user as any).profilePhoto && (session.user as any).profilePhoto.trim() !== ""
                        ? (session.user as any).profilePhoto
                        : (session.user.image && session.user.image.trim() !== ""
                          ? session.user.image
                          : `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.name}`)
                    } 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <CommentInput onSubmit={handlePostComment} />
              </div>
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
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-250 relative">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Comments ({comments.length})</span>
          <div className="relative">
            <button 
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center gap-1.5 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 transition cursor-pointer select-none"
            >
              <ListFilter size={15} />
              Sort by
            </button>
            {sortDropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200/80 rounded-xl shadow-lg py-1 w-32 z-20">
                <button
                  onClick={() => { setCommentsSort('new'); setSortDropdownOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition cursor-pointer ${commentsSort === 'new' ? 'font-bold text-black bg-gray-50/50' : 'text-gray-600'}`}
                >
                  Newest
                </button>
                <button
                  onClick={() => { setCommentsSort('top'); setSortDropdownOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition cursor-pointer ${commentsSort === 'top' ? 'font-bold text-black bg-gray-50/50' : 'text-gray-600'}`}
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
            <p className="text-center text-sm text-gray-450 italic py-6">No comments posted yet. Start the thread!</p>
          )}
        </div>
      </section>
    </article>
  );
}
