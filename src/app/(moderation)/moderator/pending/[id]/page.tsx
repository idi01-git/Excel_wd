// src/app/(moderation)/moderator/pending/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Calendar, BookOpen, Clock, Tag, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Publication {
  id: string;
  title: string;
  category: string;
  coverImage?: string | null;
  readingTime: number;
  tags: string[];
  updatedAt: string;
  content: any;
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
        <p key={index} className="text-gray-800 dark:text-neutral-205 font-sans text-base md:text-lg leading-relaxed mb-6">
          {children}
        </p>
      );
    
    case 'heading':
      const level = node.attrs?.level || 2;
      if (level === 1) {
        return <h1 key={index} className="text-3xl font-sans text-black dark:text-white font-bold mt-8 mb-4">{children}</h1>;
      } else if (level === 2) {
        return <h2 key={index} className="text-2xl font-sans text-black dark:text-white font-bold mt-10 mb-4 border-b border-gray-200/80 dark:border-neutral-800 pb-2">{children}</h2>;
      } else {
        return <h3 key={index} className="text-xl font-sans text-black dark:text-white font-bold mt-6 mb-3">{children}</h3>;
      }
    
    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-3 border-black dark:border-white bg-gray-50 dark:bg-neutral-850/50 px-5 py-3.5 my-6 rounded-r-xl font-serif italic text-gray-600 dark:text-neutral-400">
          {children}
        </blockquote>
      );
    
    case 'bulletList':
      return <ul key={index} className="list-disc pl-6 mb-6 space-y-2 text-gray-800 dark:text-neutral-300">{children}</ul>;
    
    case 'orderedList':
      return <ol key={index} className="list-decimal pl-6 mb-6 space-y-2 text-gray-800 dark:text-neutral-300">{children}</ol>;
    
    case 'listItem':
      return <li key={index}>{children}</li>;
    
    case 'horizontalRule':
      return <hr key={index} className="border-gray-200/80 dark:border-neutral-800 my-8" />;
    
    case 'image':
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || 'Inline image'}
          className="max-w-full h-auto rounded-2xl border border-gray-200 dark:border-white/10 my-8 mx-auto shadow-sm"
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
                className="text-link hover:underline"
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

export default function ModeratorDetailReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pub, setPub] = useState<Publication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Custom Modal States
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false);
  const [successModalMessage, setSuccessModalMessage] = useState<string>('');
  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string>('');

  // Validate character count (max 250 characters)
  const charCount = feedbackNote.length;

  const fetchPublication = async () => {
    try {
      const res = await fetch(`/api/moderator/${id}`);
      const data = await res.json();
      if (data.success) {
        setPub(data.publication);
      } else {
        router.push('/moderator/pending');
      }
    } catch (error) {
      console.error('Failed to load pending publication:', error);
      router.push('/moderator/pending');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublication();
  }, [id]);

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT') {
      setFeedbackNote('');
      setRejectModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/moderator/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessModalMessage('Submission approved and published live!');
        setSuccessModalOpen(true);
      } else {
        setErrorModalMessage(data.error || 'Failed to approve submission.');
        setErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to submit review decision:', error);
      setErrorModalMessage('An error occurred while submitting your review decision.');
      setErrorModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const submitRejection = async () => {
    const trimmedNote = feedbackNote.trim();
    if (!trimmedNote || charCount > 250) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/moderator/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', note: feedbackNote.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setRejectModalOpen(false);
        setSuccessModalMessage('Submission rejected. Feedback notes sent to the author.');
        setSuccessModalOpen(true);
      } else {
        setErrorModalMessage(data.error || 'Failed to reject submission.');
        setErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to submit rejection decision:', error);
      setErrorModalMessage('An error occurred while submitting your rejection decision.');
      setErrorModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !pub) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-6 animate-pulse">
        <div className="h-16 bg-gray-100 dark:bg-neutral-900/60 rounded mb-8 w-3/4"></div>
        <div className="h-6 bg-gray-100 dark:bg-neutral-900/60 rounded w-1/4 mb-16"></div>
        <div className="h-96 bg-gray-55 dark:bg-neutral-900/40 rounded"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Navigation Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/moderator/pending" 
            className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </Link>
          <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-white/20"></div>
          <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 border rounded-full font-bold uppercase tracking-widest bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30">
            {pub.category}
          </span>
        </div>

        {/* Action buttons (Top) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleReview('REJECT')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 py-2 px-5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 hover:dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-500/20 rounded-full font-bold transition text-xs uppercase tracking-wider cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Reject</span>
          </button>
          <button
            onClick={() => handleReview('APPROVE')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 py-2 px-6 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition-all duration-200 shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Publish</span>
          </button>
        </div>
      </div>

      {/* Main Review Panel */}
      <div className="flex-1 w-full max-w-3xl mx-auto py-8 md:py-16 px-6">
        <article className="w-full">
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
              <span>Pending Review</span>
            </div>

            <h1 className="w-full bg-transparent font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
              {pub.title}
            </h1>

            {/* Author Block */}
            <div className="flex items-center justify-between py-4 border-y border-gray-200/80 dark:border-white/10 mb-8">
              <div className="flex items-center gap-3">
                <img
                  src={pub.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${pub.author.name}`}
                  alt={pub.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">{pub.author.name}</span>
                  <span className="block text-[11px] text-gray-500 dark:text-neutral-500 font-medium">
                    @{pub.author.username} &middot; Submitted {new Date(pub.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-455" />
                  <span>{pub.readingTime} min read</span>
                </div>
              </div>
            </div>
          </header>

          {/* Document Content Canvas */}
          <div className="font-serif text-lg leading-relaxed text-gray-800 dark:text-neutral-200 mb-12 pb-24 border-b border-gray-200/80 dark:border-neutral-800">
            {renderTipTapJSON(pub.content)}
          </div>

          {/* Tags */}
          {pub.tags && pub.tags.length > 0 && (
            <div className="py-8 flex flex-wrap gap-2 items-center">
              <Tag className="w-4 h-4 text-gray-405 shrink-0" />
              {pub.tags.map((tag, idx) => (
                <span key={idx} className="bg-gray-100 dark:bg-neutral-800 text-gray-705 dark:text-neutral-300 text-xs font-medium px-3 py-1 rounded-full border border-gray-200/50 dark:border-neutral-700">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Review Actions */}
          <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-neutral-900/10 border border-gray-200/80 dark:border-neutral-800 rounded-2xl mb-24">
            <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-2">Review Completed?</h3>
            <p className="text-gray-500 dark:text-neutral-500 text-sm max-w-sm mb-6 px-4">
              Submit your decision. Approved publications will go live instantly. Author will receive review logs.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleReview('REJECT')}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 py-2 px-6 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 hover:dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-500/20 rounded-full font-bold transition text-xs uppercase tracking-wider cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject & Request Revision</span>
              </button>
              <button
                onClick={() => handleReview('APPROVE')}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 py-2 px-6 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition-all duration-200 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Publish Live</span>
              </button>
            </div>
          </div>
        </article>
      </div>

      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {/* Rejection Feedback Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setRejectModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl z-10"
            >
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-100 dark:border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-1">Request Revisions</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs mb-4 leading-relaxed">
                Send this draft back to the author with revision feedback.
              </p>

              {/* Draft details row for context */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200/60 dark:border-neutral-800/80 mb-4">
                {pub.coverImage && (
                  <img src={pub.coverImage} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider mb-0.5">{pub.category}</span>
                  <span className="block text-xs font-semibold text-gray-800 dark:text-neutral-200 truncate">{pub.title}</span>
                  <span className="block text-[10px] text-gray-550 dark:text-neutral-500 truncate">By @{pub.author.username}</span>
                </div>
              </div>

              <label className="text-[10px] text-gray-450 dark:text-neutral-500 uppercase tracking-widest font-bold mb-2 block">Revision Notes</label>
              <textarea
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                disabled={submitting}
                maxLength={250}
                placeholder="e.g. Please check the grammar in the second section, and replace the low-resolution cover image."
                className="w-full h-32 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition resize-none text-gray-900 dark:text-white"
              />
              <div className="flex justify-between items-center mt-1.5 text-[10px] font-medium">
                <span className={feedbackNote.trim().length >= 10 && charCount > 250 ? 'text-red-500 font-bold' : 'text-gray-450 dark:text-neutral-500'}>
                  {feedbackNote.trim().length < 10 
                    ? 'Requires at least 10 characters' 
                    : charCount > 250 
                      ? 'Exceeds 250 characters' 
                      : 'Notes ready'}
                </span>
                <span className={charCount > 250 ? 'text-red-500 font-bold' : 'text-gray-450 dark:text-neutral-500'}>
                  {charCount} / 250 characters
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => !submitting && setRejectModalOpen(false)}
                  disabled={submitting}
                  className="py-2 px-5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-750 text-gray-700 dark:text-neutral-300 text-xs font-semibold rounded-full border border-gray-200 dark:border-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRejection}
                  disabled={submitting || feedbackNote.trim().length < 10 || charCount > 250}
                  className="inline-flex items-center gap-1.5 py-2 px-6 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Request Revision'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Success Alert Modal */}
        {successModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-center z-10"
            >
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-2">Review Recorded</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs mb-6 leading-relaxed">
                {successModalMessage}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccessModalOpen(false);
                  router.push('/moderator/pending');
                }}
                className="w-full py-2 px-6 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition cursor-pointer shadow-sm"
              >
                Return to Queue
              </button>
            </motion.div>
          </div>
        )}

        {/* Error Alert Modal */}
        {errorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setErrorModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-center z-10"
            >
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-500/20">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-2">Review Failed</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs mb-6 leading-relaxed">
                {errorModalMessage}
              </p>
              <button
                type="button"
                onClick={() => setErrorModalOpen(false)}
                className="w-full py-2 px-6 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition cursor-pointer shadow-sm"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
