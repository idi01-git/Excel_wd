// src/app/(main)/community/library/page.tsx
'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';

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
  totalCopies: number;
  issuedCopies: number;
}

// ─── Book Card ────────────────────────────────────────────────────────────
const BookCard = forwardRef<HTMLDivElement, { book: BookItem; index?: number }>(
  ({ book, index = 0 }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);

    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const hov = useMotionValue(0);

    const sx = useSpring(mx,  { stiffness: 150, damping: 28, mass: 0.5 });
    const sy = useSpring(my,  { stiffness: 150, damping: 28, mass: 0.5 });
    const sh = useSpring(hov, { stiffness: 150, damping: 28 });

    const rotX  = useTransform(sy, [-0.5, 0.5], [6, -6]);
    const rotY  = useTransform(sx, [-0.5, 0.5], [-6, 6]);
    const lift  = useTransform(sh, [0, 1], [0, -8]);
    const shade = useTransform(sh, [0, 1],
      ['0 4px 16px rgba(0,0,0,0.1)', '0 20px 48px rgba(0,0,0,0.25)']
    );
    const coverZoom = useTransform(sh, [0, 1], [1, 1.05]);
    const dim = useTransform(sh, [0, 1], [0, 0.15]);

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!localRef.current) return;
      const r = localRef.current.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width  - 0.5);
      my.set((e.clientY - r.top)  / r.height - 0.5);
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
        className="h-full"
      >
      <Link href={`/community/library/${book.id}`} className="block h-full outline-none">
        <motion.div
          ref={localRef}
          onPointerMove={onMove}
          onPointerEnter={() => hov.set(1)}
          onPointerLeave={() => { hov.set(0); mx.set(0); my.set(0); }}
          style={{ rotateX: rotX, rotateY: rotY, y: lift, boxShadow: shade, transformStyle: 'preserve-3d' }}
          className="relative w-full aspect-[2/3] rounded-3xl overflow-hidden will-change-transform select-none bg-neutral-900"
        >
          {/* Edge to Edge Cover */}
          <motion.img
            style={{ scale: coverZoom }}
            src={book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover object-center will-change-transform"
          />

          {/* Smooth gradient overlay to ensure text legibility at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
          
          {/* Subtle darkening on hover */}
          <motion.div style={{ opacity: dim }} className="absolute inset-0 bg-black pointer-events-none" />

          {/* Always-visible info block */}
          <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end">
            
            {/* Title */}
            <h3 className="font-serif text-[17px] font-medium text-white leading-snug mb-1 line-clamp-2 drop-shadow-sm">
              {book.title}
            </h3>

            {/* Author and Rating Inline */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-white/70 font-light truncate mr-3">
                {book.author}
              </p>
              
              {book.avgRating > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <svg viewBox="0 0 20 20" className="w-3 h-3 fill-amber-400 drop-shadow-sm">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[12px] font-medium text-white tabular-nums drop-shadow-sm">
                    {book.avgRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
});



// ─── Standalone Filter Helpers ───────────────────────────────────────────
interface GenreBtnProps {
  g: string;
  lid: string;
  selectedGenre: string;
  setSelectedGenre: (g: string) => void;
}

const GenreBtn = ({ g, lid, selectedGenre, setSelectedGenre }: GenreBtnProps) => {
  const active = selectedGenre === g;
  return (
    <button
      onClick={() => setSelectedGenre(g)}
      className={`relative w-full text-left py-2.5 px-3.5 rounded-xl text-xs transition-colors cursor-pointer ${
        active
          ? 'font-semibold text-neutral-900 dark:text-white'
          : 'font-medium text-neutral-450 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
      }`}
    >
      {active && (
        <motion.div
          layoutId={lid}
          className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-xl z-0"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{g || 'All'}</span>
    </button>
  );
};

const GenreChip = ({ g, lid, selectedGenre, setSelectedGenre }: GenreBtnProps) => {
  const active = selectedGenre === g;
  return (
    <button
      onClick={() => setSelectedGenre(g)}
      className={`relative shrink-0 py-1.5 px-4 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
        active
          ? 'text-neutral-900 dark:text-white'
          : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
      }`}
    >
      {active && (
        <motion.div
          layoutId={lid}
          className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-full z-0 border border-neutral-200/50 dark:border-neutral-700"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{g || 'All'}</span>
    </button>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────
export default function LibraryCatalogPage() {
  const [books, setBooks]                   = useState<BookItem[]>([]);
  const [search, setSearch]                 = useState('');
  const [selectedGenre, setSelectedGenre]   = useState('');
  const [sort, setSort]                     = useState('title');
  const [sortOpen, setSortOpen]             = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const genreList = [
    'Fiction', 'Philosophy', 'Postmodernism',
    'Magical Realism', 'Poetry', 'Drama', 'Short Stories',
  ];

  const fetchBooks = async () => {
    try {
      let qs = `?search=${encodeURIComponent(search)}&sort=${sort}`;
      if (selectedGenre) qs += `&genre=${encodeURIComponent(selectedGenre)}`;
      const res  = await fetch(`/api/library${qs}`);
      const data = await res.json();
      if (data.success) setBooks(data.books);
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchBooks, 280);
    return () => clearTimeout(t);
  }, [search, selectedGenre, sort]);

  return (
    <div className="w-full max-w-6xl mx-auto pb-8 pt-0 px-4 md:px-8 text-neutral-900 dark:text-neutral-100 font-sans">

      {/* Premium Banner SVG */}
      <div className="relative rounded-3xl overflow-hidden mb-12 w-full aspect-[1642/672] md:aspect-auto md:h-72 shadow-md border border-neutral-150 dark:border-neutral-900">
        <img
          src="/images/lib banner.svg"
          alt="Library Banner"
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-44 shrink-0 sticky top-6 gap-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-2 px-3">
            Genre
          </p>
          <GenreBtn g="" lid="dg" selectedGenre={selectedGenre} setSelectedGenre={setSelectedGenre} />
          {genreList.map(g => (
            <GenreBtn 
              key={g} 
              g={g} 
              lid="dg" 
              selectedGenre={selectedGenre} 
              setSelectedGenre={setSelectedGenre} 
            />
          ))}
        </aside>

        {/* ── Main ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Mobile genre chips */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <GenreChip g="" lid="mg" selectedGenre={selectedGenre} setSelectedGenre={setSelectedGenre} />
            {genreList.map(g => (
              <GenreChip 
                key={g} 
                g={g} 
                lid="mg" 
                selectedGenre={selectedGenre} 
                setSelectedGenre={setSelectedGenre} 
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search books…"
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-850 text-gray-900 dark:text-white placeholder-neutral-450 dark:placeholder-neutral-500 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition"
              />
            </div>

            {/* Custom Premium Sort Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-850 text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-xl px-4 py-2.5 outline-none hover:border-neutral-300 dark:hover:border-neutral-600 transition cursor-pointer"
              >
                <span>{sort === 'title' ? 'A – Z' : sort === 'newest' ? 'Newest' : 'Top Rated'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-20 bg-transparent" onClick={() => setSortOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-36 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-xl shadow-xl z-30 py-1 overflow-hidden"
                    >
                      {[
                        { val: 'title', lbl: 'A – Z' },
                        { val: 'newest', lbl: 'Newest' },
                        { val: 'rating', lbl: 'Top Rated' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => {
                            setSort(opt.val);
                            setSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                            sort === opt.val
                              ? 'bg-neutral-50 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50'
                              : 'text-neutral-450 dark:text-neutral-400 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40'
                          }`}
                        >
                          {opt.lbl}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Grid */}
          {initialLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 animate-pulse overflow-hidden border border-neutral-100 dark:border-neutral-900">
                  <div className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-900" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-2 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-2 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {books.map((book, i) => <BookCard key={book.id} book={book} index={i} />)}
              </AnimatePresence>
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-neutral-400 dark:text-neutral-500 italic">
              No books found.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
