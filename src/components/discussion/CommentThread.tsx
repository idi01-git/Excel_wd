// src/components/discussion/CommentThread.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import CommentNode from './CommentNode';

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
  replies?: CommentData[];
}

interface CommentThreadProps {
  comment: CommentData;
  postAuthorId: string;
  onUpvote: (commentId: string) => Promise<void>;
  onDownvote: (commentId: string) => Promise<void>;
  onReply: (content: string, parentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  depth?: number;
}

export default function CommentThread({
  comment,
  postAuthorId,
  onUpvote,
  onDownvote,
  onReply,
  onEdit,
  onDelete,
  depth = 0
}: CommentThreadProps) {
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={`flex w-full ${depth === 0 ? 'mt-4' : 'mt-2'} group/thread`}>
      
      {/* Left Track (Avatar + Threading Line) */}
      <div className="flex flex-col items-center w-6 shrink-0 mr-2 relative z-10">
        <img
          src={comment.author.profilePhoto && comment.author.profilePhoto.trim() !== "" ? comment.author.profilePhoto : `https://api.dicebear.com/7.x/initials/svg?seed=${comment.author.name}`}
          alt={comment.author.name}
          className="w-6 h-6 rounded-full object-cover shadow-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
        />
        
        {/* Threading Line (Connects to children) - Expanded clickable area */}
        {!collapsed && hasReplies && (
          <div 
            className="flex-1 flex justify-center w-full my-1 cursor-pointer group/line"
            onClick={() => setCollapsed(true)}
            title="Collapse thread"
          >
            <div className="w-[2px] h-full bg-neutral-200 dark:bg-neutral-800 group-hover/line:bg-blue-600 dark:group-hover/line:bg-blue-400 transition-colors" />
          </div>
        )}
      </div>

      {/* Right Track (Content + Replies) */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Renders current comment body and actions */}
        <CommentNode
          comment={comment}
          postAuthorId={postAuthorId}
          onUpvote={onUpvote}
          onDownvote={onDownvote}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Recursive children rendering */}
        <AnimatePresence initial={false}>
          {!collapsed && hasReplies && (
            <motion.div 
              key="replies-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col">
                {comment.replies!.map((reply) => (
                  <CommentThread
                    key={reply.id}
                    comment={reply}
                    postAuthorId={postAuthorId}
                    onUpvote={onUpvote}
                    onDownvote={onDownvote}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    depth={depth + 1}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
