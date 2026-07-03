// src/app/(main)/community/library/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BookItem {
  id: string;
  title: string;
  author: string;
  coverImage?: string | null;
  description: string;
  genre: string[];
  availabilityStatus: 'AVAILABLE' | 'ISSUED' | 'MAINTENANCE';
  avgRating: number;
  totalReviews: number;
}

export default function LibraryCatalogPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sort, setSort] = useState('title');
  const [loading, setLoading] = useState(true);

  // Constants
  const genreChips = ['Fiction', 'Philosophy', 'Postmodernism', 'Magical Realism', 'Poetry', 'Drama', 'Short Stories'];

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let queryStr = `?search=${encodeURIComponent(search)}&sort=${sort}&`;
      if (selectedGenre) queryStr += `genre=${encodeURIComponent(selectedGenre)}&`;

      const res = await fetch(`/api/library${queryStr}`);
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (error) {
      console.error('Failed to load library books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(fetchBooks, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedGenre, sort]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ISSUED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  return (
    <div className="w-full">
      {/* Title */}
      <div className="mb-10 border-b border-white/5 pb-6">
        <h1 className="font-serif text-3xl text-white font-bold mb-1">Library Catalog</h1>
        <p className="text-gray-400 text-sm">Browse physical books owned by the club, request checkouts, and read member reviews.</p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
        {/* Search */}
        <div className="max-w-sm w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books by title or author..."
            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-violet-600 transition"
          />
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-slate-900 border border-white/10 text-white text-xs rounded-lg p-2 focus:outline-none focus:border-violet-600 transition"
          >
            <option value="title">Alphabetical (A-Z)</option>
            <option value="newest">Newly Cataloged</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Genre Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedGenre('')}
          className={`py-1.5 px-4 rounded-full text-xs font-semibold border transition ${
            selectedGenre === ''
              ? 'bg-violet-600/10 text-violet-400 border-violet-500/30'
              : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:border-white/10'
          }`}
        >
          All Genres
        </button>
        {genreChips.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`py-1.5 px-4 rounded-full text-xs font-semibold border transition ${
              selectedGenre === genre
                ? 'bg-violet-600/10 text-violet-400 border-violet-500/30'
                : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:border-white/10'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-80 bg-slate-900/60 rounded-2xl" />)}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="group bg-slate-900/30 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:shadow-2xl transition duration-300"
            >
              {/* Cover image */}
              <div className="relative h-48 rounded-xl overflow-hidden bg-slate-950 border border-white/5 mb-4 flex items-center justify-center">
                <img
                  src={book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                />
              </div>

              {/* Metadata */}
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <span className={`inline-block text-[8px] font-bold px-2 py-0.5 border rounded uppercase mb-2 ${getStatusColor(book.availabilityStatus)}`}>
                    {book.availabilityStatus.toLowerCase()}
                  </span>
                  <h3 className="font-serif text-sm font-bold text-white leading-snug line-clamp-1 group-hover:text-cyan-400 transition mb-0.5">
                    <Link href={`/community/library/${book.id}`}>{book.title}</Link>
                  </h3>
                  <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">By {book.author}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-xs"></span>
                    <span className="text-xs font-bold text-white">{book.avgRating > 0 ? book.avgRating : '—'}</span>
                    {book.totalReviews > 0 && (
                      <span className="text-[9px] text-gray-600">({book.totalReviews})</span>
                    )}
                  </div>
                  
                  <Link
                    href={`/community/library/${book.id}`}
                    className="text-[10px] font-bold text-cyan-400 hover:underline"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No books matched your criteria.
        </div>
      )}
    </div>
  );
}
