// src/components/discussion/CommentNode.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Plus } from 'lucide-react';
import { InteractionButton } from '@/components/ui/interaction-button';
import CommentInput from './CommentInput';

function formatDistanceToNow(date: Date) {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} d.`;
  if (hours > 0) return `${hours} hr.`;
  if (minutes > 0) return `${minutes} min.`;
  return `just now`;
}

interface CommentAuthor {
  id: string;
  name: string;
  username: string;
  profilePhoto?: string | null;
}

interface CommentData {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  upvotesCount: number;
  downvotesCount: number;
  isDeleted: boolean;
  author: CommentAuthor;
  upvotes: { userId: string }[];
  downvotes: { userId: string }[];
}

interface CommentNodeProps {
  comment: CommentData;
  postAuthorId: string;
  onUpvote: (commentId: string) => Promise<void>;
  onDownvote: (commentId: string) => Promise<void>;
  onReply: (content: string, parentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function CommentNode({
  comment,
  postAuthorId,
  onUpvote,
  onDownvote,
  onReply,
  onEdit,
  onDelete,
  collapsed = false,
  onToggleCollapse
}: CommentNodeProps) {
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const currentUser = session?.user;
  const isPostAuthor = comment.authorId === postAuthorId;
  const isOwnComment = currentUser ? currentUser.id === comment.authorId : false;
  const isStaff = currentUser ? (currentUser.role === 'MODERATOR' || currentUser.role === 'ADMIN') : false;
  
  const hasUpvotedInitial = currentUser ? comment.upvotes.some(u => u.userId === currentUser.id) : false;
  const hasDownvotedInitial = currentUser ? comment.downvotes?.some(u => u.userId === currentUser.id) : false;
  
  const [optimisticUpvoted, setOptimisticUpvoted] = useState(hasUpvotedInitial);
  const [optimisticDownvoted, setOptimisticDownvoted] = useState(hasDownvotedInitial);
  const [optimisticUpvotesCount, setOptimisticUpvotesCount] = useState(comment.upvotesCount);
  const [optimisticDownvotesCount, setOptimisticDownvotesCount] = useState(comment.downvotesCount || 0);

  // Sync with prop changes if they occur (e.g. from polling)
  useEffect(() => {
    setOptimisticUpvoted(hasUpvotedInitial);
    setOptimisticDownvoted(hasDownvotedInitial);
    setOptimisticUpvotesCount(comment.upvotesCount);
    setOptimisticDownvotesCount(comment.downvotesCount || 0);
  }, [hasUpvotedInitial, hasDownvotedInitial, comment.upvotesCount, comment.downvotesCount]);

  const handleUpvote = async () => {
    if (!currentUser) return alert('Please sign in to upvote comments.');
    
    const wasDownvoted = optimisticDownvoted;
    const wasUpvoted = optimisticUpvoted;

    // Adjust counts optimistically
    if (wasDownvoted) {
      setOptimisticDownvoted(false);
      setOptimisticDownvotesCount(prev => prev - 1);
    }
    setOptimisticUpvoted(!wasUpvoted);
    setOptimisticUpvotesCount(prev => wasUpvoted ? prev - 1 : prev + 1);

    try {
      await onUpvote(comment.id);
    } catch {
      // rollback
      if (wasDownvoted) {
        setOptimisticDownvoted(true);
        setOptimisticDownvotesCount(comment.downvotesCount);
      }
      setOptimisticUpvoted(wasUpvoted);
      setOptimisticUpvotesCount(comment.upvotesCount);
    }
  };

  const handleDownvote = async () => {
    if (!currentUser) return alert('Please sign in to downvote comments.');
    
    const wasDownvoted = optimisticDownvoted;
    const wasUpvoted = optimisticUpvoted;

    // Adjust counts optimistically
    if (wasUpvoted) {
      setOptimisticUpvoted(false);
      setOptimisticUpvotesCount(prev => prev - 1);
    }
    setOptimisticDownvoted(!wasDownvoted);
    setOptimisticDownvotesCount(prev => wasDownvoted ? prev - 1 : prev + 1);

    try {
      await onDownvote(comment.id);
    } catch {
      // rollback
      if (wasUpvoted) {
        setOptimisticUpvoted(true);
        setOptimisticUpvotesCount(comment.upvotesCount);
      }
      setOptimisticDownvoted(wasDownvoted);
      setOptimisticDownvotesCount(comment.downvotesCount);
    }
  };

  const handleReplySubmit = async (content: string) => {
    await onReply(content, comment.id);
    setIsReplying(false);
  };

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment? Replies will remain.')) {
      await onDelete(comment.id);
    }
  };

  const parseMarkdown = (text: string): React.ReactNode[] => {
    const regex = /(\*\*.*?\*\*|__.*?__|~~.*?~~|\*.*?\*|_.*?_)/g;
    const parts = text.split(regex);
    return parts.map((part, idx) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return <s key={idx}>{part.slice(2, -2)}</s>;
      }
      return part;
    });
  };

  const renderCommentContent = (txt: string) => {
    if (comment.isDeleted) {
      return <p className="text-gray-500 italic font-mono text-xs">{txt}</p>;
    }
    const parts = txt.split(/(@[a-zA-Z0-9_]+)/g);
    return (
      <p className="text-gray-800 whitespace-pre-line">
        {parts.map((part, index) => {
          if (part.startsWith('@') && part.length > 1) {
            const username = part.slice(1);
            return (
              <Link
                key={index}
                href={`/profile/${username}`}
                className="text-[#0000ee] hover:underline font-semibold"
              >
                {part}
              </Link>
            );
          }
          return parseMarkdown(part);
        })}
      </p>
    );
  };

  return (
    <div className="bg-transparent group">
      {/* Comment Header */}
      <div 
        className="flex items-center justify-between mb-1 cursor-pointer select-none rounded-md hover:bg-gray-50/50 transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-1.5 flex-wrap w-full">
          <span className="text-[12px] font-bold text-gray-900 leading-none">{comment.author.name}</span>
          {isPostAuthor && (
            <span className="text-[#0052cc] font-bold text-[10px] leading-none">
              OP
            </span>
          )}
          <span className="text-[11px] text-gray-500 leading-none">
            &bull; {formatDistanceToNow(new Date(comment.createdAt))} {new Date(comment.createdAt).getTime() > Date.now() - 60000 ? '' : 'ago'}
          </span>
          {collapsed && (
            <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 border border-gray-200 text-gray-500 rounded hover:bg-gray-200 hover:text-black transition-colors ml-1.5 shadow-sm" title="Expand thread">
              <Plus size={10} strokeWidth={3} />
            </span>
          )}
        </div>
      </div>

      {!collapsed && (
        <div 
          className="cursor-pointer" 
          onClick={(e) => {
            // Prevent collapsing if they click on a link or highlighted text
            if (window.getSelection()?.toString().length === 0) {
              onToggleCollapse?.();
            }
          }}
        >
          {/* Comment Body */}
          <div className="text-gray-900 text-[13.5px] leading-relaxed mb-1.5 pr-2">
            {isEditing ? (
              <div onClick={(e) => e.stopPropagation()}>
                <CommentInput
                  initialValue={comment.content}
                  onSubmit={handleEditSubmit}
                  submitLabel="Save Changes"
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              renderCommentContent(comment.content)
            )}
          </div>

          {/* Comment Actions */}
          {!comment.isDeleted && !isEditing && (
            <div 
              className="flex items-center gap-1.5 pt-0.5"
              onClick={(e) => e.stopPropagation()} // Prevent actions from collapsing the comment
            >
              {/* Reddit Style Grouped Vote Button */}
              <div className="flex items-center bg-gray-100 hover:bg-gray-200/80 rounded-full overflow-hidden transition-colors">
                <InteractionButton
                  icon={ArrowBigUp}
                  active={optimisticUpvoted}
                  onClick={(e) => { e.preventDefault(); handleUpvote(); }}
                  activeColor="text-[#ff4500]"
                  defaultColor="text-gray-600"
                  withConfetti
                  size={16}
                  className="hover:bg-gray-300/50 px-2 py-1"
                />
                <span className={`text-[12px] font-bold px-1 select-none min-w-[12px] text-center ${
                  optimisticUpvoted 
                    ? 'text-[#ff4500]' 
                    : optimisticDownvoted 
                      ? 'text-[#7193ff]' 
                      : 'text-gray-800'
                }`}>
                  {optimisticUpvotesCount - optimisticDownvotesCount}
                </span>
                <InteractionButton
                  icon={ArrowBigDown}
                  active={optimisticDownvoted}
                  onClick={(e) => { e.preventDefault(); handleDownvote(); }}
                  activeColor="text-[#7193ff]"
                  defaultColor="text-gray-600"
                  size={16}
                  className="hover:bg-gray-300/50 px-2 py-1"
                />
              </div>
              
              {currentUser && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200/80 rounded-full px-3 py-1.5 transition-colors text-[12px] font-bold text-gray-700"
                >
                  <MessageSquare size={14} />
                  Reply
                </button>
              )}

              {isOwnComment && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 hover:bg-gray-100 rounded-full px-3 py-1 transition-colors text-[12px] font-bold text-gray-500 opacity-0 group-hover:opacity-100"
                >
                  Edit
                </button>
              )}

              {(isOwnComment || isStaff) && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 hover:bg-red-50 rounded-full px-3 py-1 transition-colors text-[12px] font-bold text-red-500 opacity-0 group-hover:opacity-100"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {/* Inline Reply input */}
          {isReplying && (
            <div className="mt-4 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
              <CommentInput
                onSubmit={handleReplySubmit}
                submitLabel="Reply"
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
