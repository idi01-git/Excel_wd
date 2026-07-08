'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BookDetailClient({ book, reviews: initialReviews, user }: { book: any, reviews: any[], user: any }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [endorseCount, setEndorseCount] = useState<number>(book.endorseCount);
  const [hasEndorsed, setHasEndorsed] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Use the book's themeColor or fallback
  const themeColor = book.themeColor || '#a855f7'; // fallback to purple-500
  
  // Create a light/dark version for gradients based on themeColor (assuming it's a hex)
  // For simplicity, we just use the raw hex in inline styles for glowing effects.
  
  const handleEndorse = async () => {
    if (!user) return alert('Please sign in to endorse');
    if (hasEndorsed) return;
    
    setEndorseCount(prev => prev + 1);
    setHasEndorsed(true);
    
    // In a real app, call API here to increment endorse count
    await fetch(`/api/books/${book.id}/endorse`, { method: 'POST' }).catch(console.error);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to review');
    if (!reviewText.trim()) return;

    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/books/${book.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText, rating: 5 }) // default 5 star for now
      });
      const data = await res.json();
      if (data.success) {
        setReviews([data.review, ...reviews]);
        setReviewText('');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Top 3 reviews for Cascade layout
  const topReviews = reviews.slice(0, 3);
  const remainingReviews = reviews.slice(3);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white selection:bg-black/10 dark:selection:bg-white/20 pb-32">
      {/* Background Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[600px] rounded-full blur-[150px] opacity-10 dark:opacity-20 pointer-events-none"
        style={{ backgroundColor: themeColor }}
      ></div>

      <div className="w-full max-w-7xl mx-auto px-6 pt-12 md:pt-24 relative z-10">
        
        {/* Breadcrumb */}
        <div className="mb-12">
          <Link href="/editors-shelf" className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition text-sm font-medium flex items-center gap-2">
            <span>&larr;</span> Back to Shelf
          </Link>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 mb-24 items-start">
          
          {/* Left: Book Cover */}
          <div className="w-full lg:w-5/12 shrink-0">
            <div className="relative aspect-2/3 w-full rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl dark:shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-gray-200 dark:border-white/10 group">
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-2xl z-0"
                style={{ background: `linear-gradient(45deg, ${themeColor}, transparent)` }}
              ></div>
              <img 
                src={book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=1200&fit=crop'} 
                alt={book.title}
                className="w-full h-full object-cover relative z-10 transform group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Right: Book Details */}
          <div className="w-full lg:w-7/12 pt-4">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {book.editorPickType && (
                <span 
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                  style={{ color: themeColor, borderColor: `${themeColor}40`, backgroundColor: `${themeColor}10` }}
                >
                  Editor's Pick: {book.editorPickType}
                </span>
              )}
              {book.genre.map((g: string) => (
                <span key={g} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                  {g}
                </span>
              ))}
            </div>

            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 leading-tight">{book.title}</h1>
            <p className="text-2xl text-gray-600 dark:text-gray-400 font-light mb-8">By {book.author}</p>

            <div className="flex items-center gap-4 mb-10">
              <button 
                onClick={handleEndorse}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all ${
                  hasEndorsed 
                    ? 'bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20 text-black dark:text-white' 
                    : 'bg-transparent border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-gray-500 dark:hover:border-white/40'
                }`}
              >
                <svg className={`w-5 h-5 ${hasEndorsed ? 'text-yellow-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="font-bold">{endorseCount} {endorseCount === 1 ? 'Endorsement' : 'Endorsements'}</span>
              </button>
              
              <div className="h-8 w-px bg-gray-300 dark:bg-white/10"></div>
              
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                {book.pageCount && <span>{book.pageCount} Pages</span>}
                {book.publishedYear && <span>{book.publishedYear}</span>}
              </div>
            </div>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light mb-12">
              {book.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {book.amazonLink && (
                <a 
                  href={book.amazonLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-80 transition-opacity shadow-lg"
                >
                  Buy Now
                </a>
              )}
              {book.downloadLink && (
                <a 
                  href={book.downloadLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-transparent border border-black/20 dark:border-white/20 text-black dark:text-white font-bold rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download E-Book
                </a>
              )}
              {!book.amazonLink && !book.downloadLink && (
                <button className="px-8 py-4 bg-white/10 text-white font-bold rounded-full cursor-not-allowed opacity-50">
                  Not Available for Purchase
                </button>
              )}
            </div>
          </div>
        </div>

        {/* From The Club Section */}
        {book.clubReview && (
          <div className="mb-32 relative">
            <div className="absolute top-0 left-0 w-2 h-full rounded-full" style={{ backgroundColor: themeColor }}></div>
            <div className="pl-8 md:pl-12 py-4">
              <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gray-500 font-bold mb-4">From The Club</h3>
              <p className="font-serif text-2xl md:text-4xl leading-relaxed text-black dark:text-gray-200 italic">
                "{book.clubReview}"
              </p>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="border-t border-gray-200 dark:border-white/10 pt-24">
          <div className="flex items-center justify-between mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Community Thoughts</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            
            {/* Left: Review Submission */}
            <div className="lg:col-span-4 lg:pr-8 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10 pb-12 lg:pb-0">
              <h3 className="text-xl font-bold mb-6">Leave a Review</h3>
              {user ? (
                <form onSubmit={submitReview} className="space-y-4">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="What did you think of this book?"
                    rows={5}
                    required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-black dark:text-white rounded-2xl p-4 text-sm outline-none focus:border-black dark:focus:border-white/30 transition resize-none placeholder-gray-400 dark:placeholder-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post Review'}
                  </button>
                </form>
              ) : (
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-2xl text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">You must be signed in to leave a review.</p>
                  <Link href="/login" className="inline-block py-2 px-6 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm">
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Right: Cascade Layout for Reviews */}
            <div className="lg:col-span-8">
              {topReviews.length > 0 ? (
                <div className="space-y-6">
                  {/* #1 Top Review (Hero) */}
                  <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10">
                      <svg className="w-24 h-24 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <img 
                          src={topReviews[0].reviewer.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${topReviews[0].reviewer.name}`} 
                          alt={topReviews[0].reviewer.name}
                          className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-white/20"
                        />
                        <div>
                          <h4 className="font-bold">{topReviews[0].reviewer.name}</h4>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Top Review • {topReviews[0].upvotesCount} Likes</span>
                        </div>
                      </div>
                      <p className="text-xl font-serif leading-relaxed text-gray-700 dark:text-gray-300 italic mb-4">"{topReviews[0].reviewText}"</p>
                    </div>
                  </div>

                  {/* #2 and #3 Reviews (Side by Side) */}
                  {topReviews.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {topReviews.slice(1).map(review => (
                        <div key={review.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl">
                          <div className="flex items-center gap-3 mb-4">
                            <img 
                              src={review.reviewer.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${review.reviewer.name}`} 
                              alt={review.reviewer.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <h4 className="font-bold text-sm">{review.reviewer.name}</h4>
                              <span className="text-[10px] text-gray-500 uppercase font-bold">{review.upvotesCount} Likes</span>
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">"{review.reviewText}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Remaining Reviews (List) */}
                  {remainingReviews.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/5 space-y-6">
                      {remainingReviews.map(review => (
                        <div key={review.id} className="flex gap-4">
                          <img 
                            src={review.reviewer.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${review.reviewer.name}`} 
                            alt={review.reviewer.name}
                            className="w-10 h-10 rounded-full shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm">{review.reviewer.name}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-600">• {new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{review.reviewText}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-gray-300 dark:border-white/10 rounded-3xl">
                  <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
