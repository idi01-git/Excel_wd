// src/app/(main)/community/library/[id]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  if (loading || !book) {
    return (
      <div className="max-w-4xl mx-auto py-16 animate-pulse">
        <div className="h-8 bg-slate-900/60 rounded w-1/3 mb-10"></div>
        <div className="h-96 bg-slate-900/60 rounded-2xl"></div>
      </div>
    );
  }

  // Calculate star percentages for Goodreads-style bar charts
  const ratingDistribution = [0, 0, 0, 0, 0]; // index 0 maps to 1 star, index 4 maps to 5 stars
  book.reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating - 1]++;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'ISSUED':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      default:
        return 'bg-red-500/15 text-red-400 border-red-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Back to Library */}
      <button onClick={() => router.push('/community/library')} className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Catalog
      </button>

      {/* Book details section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Book cover column */}
        <div className="md:col-span-1">
          <div className="relative aspect-[3/4.5] rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl flex items-center justify-center">
            <img
              src={book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Availability Actions Box */}
          <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl mt-6 shadow-xl space-y-4">
            <div>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Status</span>
              <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 border rounded uppercase ${getStatusColor(book.availabilityStatus)}`}>
                {book.availabilityStatus.toLowerCase()}
              </span>
            </div>
            
            <div className="text-xs text-gray-400 space-y-1">
              <p>Copies Cataloged: <strong className="text-white">{book.totalCopies}</strong></p>
              <p>Currently Issued: <strong className="text-white">{book.issuedCopies}</strong></p>
              <p>Available: <strong className="text-white">{Math.max(0, book.totalCopies - book.issuedCopies)}</strong></p>
            </div>

            {/* Borrow Actions */}
            {book.availabilityStatus === 'AVAILABLE' && (book.totalCopies - book.issuedCopies > 0) ? (
              userState.hasRequested ? (
                <div className="p-3 bg-violet-600/10 border border-violet-500/20 text-center rounded-xl text-xs font-semibold text-violet-400">
                  Loan Request: {userState.activeRequest.status.toLowerCase()}
                </div>
              ) : session ? (
                <button
                  onClick={() => setLoanModalOpen(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 text-white rounded-xl text-xs font-semibold transition"
                >
                  Request to Borrow
                </button>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition"
                >
                  Log In to Borrow
                </button>
              )
            ) : (
              <div className="p-3 bg-red-600/10 border border-red-500/20 text-center rounded-xl text-xs font-semibold text-red-400">
                Out of Stock / Checked Out
              </div>
            )}
          </div>
        </div>

        {/* Book metadata column */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-white font-bold mb-1 leading-tight">{book.title}</h1>
            <p className="text-gray-400 text-sm">By <strong className="text-white font-serif">{book.author}</strong></p>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 text-base"></span>
                <span className="text-base font-bold text-white">{stats.avgRating > 0 ? stats.avgRating : '—'}</span>
                <span className="text-xs text-gray-500">avg rating</span>
              </div>
              <span className="text-gray-700">|</span>
              <span className="text-xs text-gray-400 font-semibold">{stats.totalReviews} member reviews</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {book.genre.map(g => (
                <span key={g} className="text-[9px] font-bold bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/20 border border-white/5 p-6 rounded-2xl">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 font-sans">Book Synopsis</h3>
            <p className="text-gray-300 text-sm leading-relaxed font-sans">{book.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/5 pt-5 text-xs text-gray-500">
            {book.isbn && <p>ISBN: <strong className="text-gray-300">{book.isbn}</strong></p>}
            {book.pageCount && <p>Page Count: <strong className="text-gray-300">{book.pageCount} pages</strong></p>}
            {book.publishedYear && <p>Published: <strong className="text-gray-300">{book.publishedYear}</strong></p>}
          </div>
        </div>
      </div>

      {/* Ratings Distribution (Goodreads-style Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 border-t border-white/10 pt-8">
        <div className="md:col-span-1 flex flex-col justify-center items-center p-6 bg-slate-900/20 border border-white/5 rounded-2xl">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Member Rating</span>
          <span className="text-5xl font-bold text-white font-serif">{stats.avgRating}</span>
          <div className="flex gap-0.5 text-yellow-400 text-lg mt-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s}>{s <= Math.round(stats.avgRating) ? '' : ''}</span>
            ))}
          </div>
          <span className="text-xs text-gray-500">{stats.totalReviews} reviews total</span>
        </div>

        {/* Bar chart breakdown */}
        <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
          {ratingDistribution.map((count, index) => {
            const star = index + 1;
            const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center text-xs gap-3">
                <span className="w-10 text-gray-500 font-semibold">{star} Star</span>
                <div className="flex-grow h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-violet-600 rounded-full"
                  />
                </div>
                <span className="w-10 text-right text-gray-500 font-semibold">{count}</span>
              </div>
            );
          }).reverse()}
        </div>
      </div>

      {/* Write a review panel */}
      {session && (
        <section className="mb-12 p-6 bg-slate-900/30 border border-white/5 rounded-2xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
            <h3 className="font-serif text-lg text-white font-bold">
              {userState.hasReviewed ? 'Edit Your Review' : 'Write a Critique'}
            </h3>
            {userState.hasReviewed && (
              <button
                onClick={handleReviewDelete}
                disabled={reviewLoading}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold transition"
              >
                Delete Review
              </button>
            )}
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Your Rating:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-xl focus:outline-none transition ${
                      rating >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think of the themes? Share your thoughts..."
                rows={3}
                required
                className="bg-slate-950 border border-white/10 text-white rounded-xl p-3 text-xs outline-none focus:border-violet-600 transition"
              />
            </div>

            <button
              type="submit"
              disabled={reviewLoading}
              className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition"
            >
              {reviewLoading ? 'Submitting...' : userState.hasReviewed ? 'Update Review' : 'Post Review'}
            </button>
          </form>
        </section>
      )}

      {/* Reviews feed list */}
      <section className="space-y-6">
        <h3 className="font-serif text-xl text-white font-bold border-b border-white/5 pb-2 mb-6">Review Feed</h3>
        {book.reviews.length > 0 ? (
          <div className="space-y-4">
            {book.reviews.map((rev) => (
              <div key={rev.id} className="bg-slate-900/20 border border-white/5 p-5 rounded-2xl space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.reviewer.profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${rev.reviewer.username}`}
                      alt={rev.reviewer.name}
                      className="w-7 h-7 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-white">{rev.reviewer.name}</span>
                      <span className="block text-[9px] text-gray-500">@{rev.reviewer.username}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex text-yellow-400 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < rev.rating ? '' : ''}</span>
                      ))}
                    </div>
                    <span className="text-[9px] text-gray-600 mt-0.5">
                      {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <p className="text-gray-300 text-xs leading-relaxed pl-1 font-sans">
                  {rev.reviewText}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-600 italic py-6">No member reviews yet. Be the first to share your thoughts!</p>
        )}
      </section>

      {/* Borrow Loan Request Modal */}
      {loanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-5">
              <h3 className="font-serif text-base text-white font-bold">Borrow Request</h3>
              <button onClick={() => setLoanModalOpen(false)} className="text-gray-500 hover:text-white"></button>
            </div>

            <form onSubmit={handleLoanSubmit} className="space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                You are requesting to borrow <strong className="text-white">"{book.title}"</strong> from the physical library.
              </p>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Expected Return Date</label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  required
                  className="bg-slate-900 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setLoanModalOpen(false)}
                  className="py-1.5 px-4 bg-transparent border border-white/10 text-white hover:bg-white/5 rounded-full text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loanLoading}
                  className="py-1.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition"
                >
                  {loanLoading ? 'Requesting...' : 'Request Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
