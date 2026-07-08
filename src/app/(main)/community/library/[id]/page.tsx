// src/app/(main)/community/library/[id]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2, AlertCircle, Star, Calendar, Clock, ShieldAlert, ChevronUp, Minus, Plus, Barcode, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    username: string;
    profilePhoto?: string | null;
  };
}

interface BookDetail {
  id: string;
  title: string;
  author: string;
  coverImage?: string | null;
  description: string;
  genre: string[];
  isbn?: string | null;
  pageCount?: number | null;
  publishedYear?: number | null;
  availabilityStatus: 'AVAILABLE' | 'ISSUED' | 'MAINTENANCE';
  totalCopies: number;
  issuedCopies: number;
  amazonLink?: string | null;
  reviews: Review[];
}

export default function BookDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0 });
  const [userState, setUserState] = useState<{
    hasRequested: boolean;
    activeRequest: any;
    hasReviewed: boolean;
    userReview: any;
  }>({ hasRequested: false, activeRequest: null, hasReviewed: false, userReview: null });
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Issue Request Modal state
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [loanLoading, setLoanLoading] = useState(false);

  const fetchBookDetail = async () => {
    try {
      const res = await fetch(`/api/library/${id}`);
      const data = await res.json();
      if (data.success) {
        setBook(data.book);
        setStats(data.stats);
        setUserState(data.userState);
        
        if (data.userState.hasReviewed && data.userState.userReview) {
          setRating(data.userState.userReview.rating);
          setReviewText(data.userState.userReview.reviewText);
        }
      } else {
        router.push('/community/library');
      }
    } catch (error) {
      console.error('Failed to load book detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetail();
  }, [id, session]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || reviewLoading) return;

    setReviewLoading(true);
    const method = userState.hasReviewed ? 'PUT' : 'POST';
    const endpoint = userState.hasReviewed 
      ? `/api/reviews/${userState.userReview.id}`
      : `/api/library/${id}/reviews`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, reviewText })
      });
      const data = await res.json();
      if (data.success) {
        if (!userState.hasReviewed) {
          setReviewText('');
        }
        fetchBookDetail();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!userState.hasReviewed || !confirm('Are you sure you want to delete your review?')) return;

    setReviewLoading(true);
    try {
      const res = await fetch(`/api/reviews/${userState.userReview.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setReviewText('');
        setRating(5);
        fetchBookDetail();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedReturnDate || loanLoading) return;

    setLoanLoading(true);
    try {
      const res = await fetch(`/api/library/${id}/issue-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnDate: expectedReturnDate })
      });
      const data = await res.json();
      if (data.success) {
        setLoanModalOpen(false);
        fetchBookDetail();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error submitting issue request:', error);
    } finally {
      setLoanLoading(false);
    }
  };

  // Calculate star percentages for Goodreads-style bar charts
  const ratingDistribution = [0, 0, 0, 0, 0];
  if (book) {
    book.reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating - 1]++;
      }
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'ISSUED':
        return 'bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20';
      default:
        return 'bg-red-50 text-red-600 border-red-250 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20';
    }
  };

  if (loading || !book) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 animate-pulse">
        <div className="h-8 bg-gray-250 dark:bg-neutral-900/60 rounded w-1/3 mb-10"></div>
        <div className="h-96 bg-gray-250 dark:bg-neutral-900/60 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 pt-0 px-4 md:px-8 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Back Button */}
      <button 
        onClick={() => router.push('/community/library')} 
        className="text-xs font-semibold text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-10 flex items-center gap-2 cursor-pointer bg-transparent border-0 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to library</span>
      </button>

      {/* Top Section: Balanced Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20 items-start">
        
        {/* Left Column: Book Cover Pedestal (Symmetrical & Focused) */}
        <div className="lg:col-span-5 w-full">
          <div className="w-full aspect-[4/5] bg-neutral-50 dark:bg-[#141416] rounded-[32px] flex items-center justify-center p-8 lg:p-12 border border-neutral-150 dark:border-neutral-900 shadow-inner">
            <motion.div 
              whileHover="hover"
              className="relative max-w-[240px] sm:max-w-[280px] w-full"
            >
              {/* Stable atmospheric drop shadow with spring animation */}
              <motion.div 
                variants={{
                  hover: { scale: 1.02 }
                }}
                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-lg blur-2xl transform translate-y-6 translate-x-2 pointer-events-none" 
              />
              <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-black/5 dark:border-white/10 shadow-2xl">
                <motion.img
                  src={book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'}
                  alt={book.title}
                  variants={{
                    hover: { scale: 1.05 }
                  }}
                  transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Title, Metadata, Description & Actions */}
        <div className="lg:col-span-7 flex flex-col pt-2 lg:pt-4">
          
          {/* Title and Author */}
          <div className="mb-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-neutral-900 dark:text-neutral-50 font-bold mb-2 leading-[1.15] tracking-tight">
              {book.title}
            </h1>
            <p className="text-lg md:text-xl text-neutral-500 dark:text-neutral-400 font-serif italic">
              by {book.author}
            </p>
          </div>

          {/* Integrated Metadata Info Row (No breaking symmetry) */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs font-semibold text-neutral-400 dark:text-neutral-500 mb-8 pb-6 border-b border-neutral-100 dark:border-neutral-900">
            <span>ISBN {book.isbn || 'N/A'}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-800" />
            <span>{book.pageCount ? `${book.pageCount} pages` : 'Unknown length'}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-800" />
            <span>Published {book.publishedYear || 'Unknown'}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-800" />
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${book.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
              {book.availabilityStatus}
            </span>
          </div>

          {/* About Section */}
          <div className="space-y-3 mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold">About the book</h3>
            <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
              {book.description}
            </p>
          </div>

          {/* Genres */}
          <div className="space-y-3 mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold">Genres</h3>
            <div className="flex flex-wrap gap-1.5">
              {book.genre.map(g => (
                <span key={g} className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-900 text-neutral-600 dark:text-neutral-300">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Borrow Actions */}
          <div className="flex items-center gap-4 mt-4 pt-6 border-t border-neutral-100 dark:border-neutral-900">
            {/* Copies Available Pill */}
            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-900 rounded-full px-4 py-3 shrink-0">
              <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">Available</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white min-w-[20px] text-center">
                {Math.max(0, book.totalCopies - book.issuedCopies)}
              </span>
            </div>

            {book.availabilityStatus === 'AVAILABLE' && (book.totalCopies - book.issuedCopies > 0) ? (
              userState.hasRequested ? (
                <button disabled className="flex-grow py-3.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-555 rounded-full text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                  Loan Requested
                </button>
              ) : session ? (
                <button
                  onClick={() => setLoanModalOpen(true)}
                  className="flex-grow py-3.5 bg-black hover:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:shadow-lg shadow-black/10 dark:shadow-white/10 cursor-pointer"
                >
                  Request to Borrow
                </button>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="flex-grow py-3.5 border border-black dark:border-white text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-full text-xs font-bold uppercase tracking-widest transition cursor-pointer"
                >
                  Log In to Borrow
                </button>
              )
            ) : (
              <button disabled className="flex-grow py-3.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-555 rounded-full text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                Currently Unavailable
              </button>
            )}

            {book.amazonLink && (
              <a 
                href={book.amazonLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-grow py-3.5 border border-black dark:border-white text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-full text-xs font-bold uppercase tracking-widest transition text-center cursor-pointer"
              >
                Buy Now
              </a>
            )}

            {/* Circular Download Button */}
            <button
              onClick={() => alert('Downloading PDF / digital copy...')}
              className="w-12 h-12 rounded-full border border-neutral-200/60 dark:border-neutral-900 flex items-center justify-center text-neutral-850 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition cursor-pointer shrink-0 shadow-sm"
              title="Download Digital Version"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Section: Reviews & Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 border-t border-neutral-100 dark:border-neutral-900 pt-16 mb-16">
        
        {/* Rating Overview */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-12">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-6">Reviews & Ratings</h2>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-semibold tracking-tighter text-neutral-900 dark:text-white leading-none">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-lg text-neutral-400 font-medium">/ 5</span>
            </div>
            
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.round(stats.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-200 dark:text-neutral-800'}`} 
                  />
                ))}
              </div>
              <span className="text-xs text-neutral-400 font-medium">({stats.totalReviews} ratings)</span>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-2 max-w-xs w-full">
            {ratingDistribution.map((count, index) => {
              const star = index + 1;
              const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center text-xs gap-3">
                  <div className="flex items-center gap-1 w-6 text-neutral-400 font-semibold">
                    <span>{star}</span>
                    <Star className="w-3 h-3 fill-neutral-400 text-neutral-400" />
                  </div>
                  <div className="flex-grow h-1 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-neutral-900 dark:bg-white rounded-full" />
                  </div>
                </div>
              );
            }).reverse()}
          </div>

          {/* Submission Form */}
          <div className="border-t border-neutral-100 dark:border-neutral-900 pt-8 w-full max-w-xs">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
              {userState.hasReviewed ? 'Edit your review' : 'Review this book'}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">Share your review with other members</p>
            
            {session ? (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="focus:outline-none transition cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${rating >= s ? 'fill-amber-400 text-amber-400' : 'text-neutral-200 dark:text-neutral-800 hover:text-amber-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your thoughts..."
                  rows={3}
                  required
                  className="bg-transparent border border-neutral-200 dark:border-neutral-900 text-neutral-900 dark:text-white rounded-xl p-3 text-xs outline-none focus:border-neutral-900 dark:focus:border-white transition resize-none"
                />
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black rounded-full text-xs font-bold transition cursor-pointer"
                >
                  {reviewLoading ? 'Submitting...' : userState.hasReviewed ? 'Update Review' : 'Submit Review'}
                </button>
                {userState.hasReviewed && (
                  <button
                    type="button"
                    onClick={handleReviewDelete}
                    disabled={reviewLoading}
                    className="w-full text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Delete Review
                  </button>
                )}
              </form>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="w-full py-2.5 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-full text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition cursor-pointer"
              >
                Log In to Review
              </button>
            )}
          </div>
        </div>

        {/* Reviews Stream */}
        <div className="lg:col-span-8">
           {book.reviews.length > 0 ? (
             <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
               {book.reviews.map((rev) => (
                 <div key={rev.id} className="py-6 first:pt-0 last:pb-0">
                   <div className="flex items-start justify-between gap-4 mb-3">
                     <div className="flex items-center gap-3">
                       <img
                         src={rev.reviewer.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${rev.reviewer.name}`}
                         alt={rev.reviewer.name}
                         className="w-8 h-8 rounded-full object-cover bg-neutral-100"
                       />
                       <div>
                         <span className="block text-xs font-bold text-neutral-950 dark:text-neutral-50">{rev.reviewer.name}</span>
                         <span className="block text-[10px] text-neutral-400">Member</span>
                       </div>
                     </div>
                     <span className="text-[10px] text-neutral-400 font-medium">
                       {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                     </span>
                   </div>
                   
                   <div className="flex gap-0.5 mb-3">
                     {Array.from({ length: 5 }).map((_, i) => (
                       <Star 
                         key={i} 
                         className={`w-3 h-3 ${i < rev.rating ? 'fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white' : 'text-neutral-200 dark:text-neutral-800'}`} 
                       />
                     ))}
                   </div>

                   <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                     "{rev.reviewText}"
                   </p>
                 </div>
               ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full py-16 text-center">
               <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">No reviews yet</p>
             </div>
           )}
           {book.reviews.length > 4 && (
             <div className="flex justify-center mt-8">
               <button className="py-2.5 px-6 border border-neutral-200 dark:border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900 transition">
                 Load More
               </button>
             </div>
           )}
        </div>

      </div>

      {/* Borrow Loan Request Modal */}
      <AnimatePresence>
        {loanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLoanModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0, y: 8 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#111112] border border-neutral-100 dark:border-neutral-900 rounded-[28px] p-8 shadow-2xl text-center z-10"
            >
              <div className="w-12 h-12 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-100 dark:border-neutral-900">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-2">Borrow Request</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 leading-relaxed">
                You are requesting to borrow <strong className="text-neutral-900 dark:text-white font-bold">{book.title}</strong>
              </p>

              <form onSubmit={handleLoanSubmit} className="space-y-6 text-left">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold block ml-1">Expected Return Date</label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 text-neutral-900 dark:text-white rounded-2xl p-4 text-xs font-semibold outline-none focus:border-neutral-900 dark:focus:border-white transition"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setLoanModalOpen(false)}
                    className="flex-1 py-3.5 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-bold rounded-full transition cursor-pointer text-center uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loanLoading}
                    className="flex-1 py-3.5 bg-black hover:bg-neutral-950 dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-white text-xs font-bold rounded-full transition cursor-pointer text-center uppercase tracking-widest"
                  >
                    {loanLoading ? 'Wait...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
