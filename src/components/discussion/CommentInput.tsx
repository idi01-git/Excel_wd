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
        className="w-full bg-transparent border-0 border-b border-gray-200 px-0 py-2 text-black text-sm outline-none focus:border-black focus:ring-0 transition-colors resize-none overflow-hidden placeholder:text-gray-400"
      />
      
      {/* Controls reveal when there is content or focus */}
      <div className={`flex justify-between items-center mt-2 transition-opacity duration-300 ${content.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto'}`}>
        <span className="text-[10px] text-gray-400 font-medium">Markdown supported (*italic*, **bold**, ~~strikethrough~~)</span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="py-1.5 px-4 bg-transparent hover:bg-gray-100 rounded-full text-xs text-gray-500 font-bold transition"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="py-1.5 px-5 bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-xs text-white font-bold shadow-sm transition"
          >
            {loading ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
