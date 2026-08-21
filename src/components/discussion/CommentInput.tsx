// src/components/discussion/CommentInput.tsx
'use client';

import { useState } from 'react';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  initialValue?: string;
}

export default function CommentInput({
  onSubmit,
  placeholder = 'Add to the discussion...',
  submitLabel = 'Post Comment',
  cancelLabel = 'Cancel',
  onCancel,
  initialValue = ''
}: CommentInputProps) {
  const [content, setContent] = useState<string>(initialValue);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={content.length > 0 ? 3 : 1}
        disabled={loading}
        className="w-full bg-transparent border-0 border-b border-neutral-200 dark:border-neutral-700 px-0 py-2 text-neutral-900 dark:text-neutral-100 text-sm outline-none focus:border-neutral-950 dark:focus:border-neutral-100 focus:ring-0 transition-colors resize-none overflow-hidden placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
      />
      
      {/* Controls reveal when there is content or focus */}
      <div className={`flex justify-between items-center mt-2 transition-opacity duration-300 ${content.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto'}`}>
        <span className="text-[10px] text-muted-foreground font-medium">Markdown supported (*italic*, **bold**, ~~strikethrough~~)</span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="py-1.5 px-4 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-xs text-neutral-600 dark:text-neutral-400 font-bold transition cursor-pointer"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="py-1.5 px-5 bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-xs text-white dark:text-neutral-950 font-bold shadow-sm transition cursor-pointer"
          >
            {loading ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
