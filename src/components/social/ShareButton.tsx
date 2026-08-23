'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  Copy,
  Check,
  X,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOptimizedCoverUrl, getOptimizedAvatarUrl } from '@/lib/image-optimization';

interface ShareButtonProps {
  title: string;
  authorName?: string | null;
  authorPhoto?: string | null;
  category?: string | null;
  coverImage?: string | null;
  readingTime?: number | null;
  url?: string | null;
  description?: string | null;
  className?: string;
  compact?: boolean;
}

export default function ShareButton({
  title,
  authorName,
  authorPhoto,
  category,
  coverImage,
  readingTime,
  url,
  description,
  className,
  compact = false,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : (url || '');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl,
        });
        setOpen(false);
      } catch {
        // User cancelled
      }
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(shareUrl)}`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${title} - ${shareUrl}`
  )}`;

  const mailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
    `Read "${title}" on Excelsior:\n\n${shareUrl}`
  )}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer select-none text-xs font-medium",
          compact ? "p-2" : "py-2 px-4",
          className
        )}
        aria-label="Share article"
      >
        <Share2 size={compact ? 14 : 16} strokeWidth={1.8} />
        {!compact && <span>Share</span>}
      </button>

      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 sm:p-6">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-neutral-900 dark:text-neutral-100"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                      <Share2 size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-serif leading-none">Share Publication</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Spread the story with your network</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Rich Editorial Preview Card */}
                  <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/90 dark:border-neutral-700/70 overflow-hidden shadow-xs">
                    {coverImage && (
                      <div className="relative w-full h-32 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <img
                          src={getOptimizedCoverUrl(coverImage, 400)}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                        {category && (
                          <span className="absolute bottom-2.5 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                            {category}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="p-4">
                      {!coverImage && category && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 bg-neutral-200/80 dark:bg-neutral-700 px-2.5 py-0.5 rounded-full mb-2">
                          {category}
                        </span>
                      )}

                      <h4 className="text-base font-bold font-serif text-neutral-950 dark:text-white leading-snug line-clamp-2 mb-3">
                        {title}
                      </h4>

                      <div className="flex items-center justify-between pt-2.5 border-t border-neutral-200/60 dark:border-neutral-700/60 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {authorPhoto ? (
                            <img
                              src={getOptimizedAvatarUrl(authorPhoto, 48)}
                              alt={authorName || "Author"}
                              className="w-5 h-5 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] font-bold flex items-center justify-center text-neutral-700 dark:text-neutral-200 shrink-0">
                              {authorName ? authorName.charAt(0) : "E"}
                            </div>
                          )}
                          <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                            {authorName || "Excelsior Writer"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 font-mono">
                          <span>Excelsior</span>
                          {readingTime && (
                            <>
                              <span>&middot;</span>
                              <span>{readingTime} min</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Copy Link Input Bar */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 block uppercase tracking-wider">
                      Direct Link
                    </label>
                    <div className="flex items-center gap-2 p-1.5 pl-3.5 bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="bg-transparent text-xs text-neutral-700 dark:text-neutral-200 flex-1 outline-none truncate font-mono select-all"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={handleCopyLink}
                        className={cn(
                          "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0",
                          copied
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200"
                        )}
                      >
                        {copied ? (
                          <>
                            <Check size={14} strokeWidth={2.5} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} strokeWidth={2} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Social Share Grid */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-2 block uppercase tracking-wider">
                      Share via
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {/* X / Twitter */}
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 transition-all hover:scale-105 group"
                      >
                        <div className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">X (Twitter)</span>
                      </a>

                      {/* LinkedIn */}
                      <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 transition-all hover:scale-105 group"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#0A66C2] flex items-center justify-center text-white">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">LinkedIn</span>
                      </a>

                      {/* WhatsApp */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 transition-all hover:scale-105 group"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43-.14-.01-.31-.01-.47-.01s-.44.06-.67.31c-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.59.21-1.09.15-1.18-.07-.1-.23-.15-.48-.28" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">WhatsApp</span>
                      </a>

                      {/* Email / Device Share */}
                      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                        <button
                          onClick={handleNativeShare}
                          className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 transition-all hover:scale-105 group cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-full bg-neutral-700 dark:bg-neutral-600 flex items-center justify-center text-white">
                            <ExternalLink size={16} strokeWidth={2} />
                          </div>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">More...</span>
                        </button>
                      ) : (
                        <a
                          href={mailUrl}
                          onClick={() => setOpen(false)}
                          className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 transition-all hover:scale-105 group"
                        >
                          <div className="w-9 h-9 rounded-full bg-neutral-700 dark:bg-neutral-600 flex items-center justify-center text-white">
                            <Mail size={16} strokeWidth={2} />
                          </div>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">Email</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
