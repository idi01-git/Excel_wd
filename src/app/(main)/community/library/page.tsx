// src/app/(main)/community/library/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Languages, BookOpen, X, Check } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';

interface BookItem {
  id: string;
  title: string;
  author: string;
  language: 'ENGLISH' | 'HINDI';
  coverImage?: string | null;
  description: string;
  genre: string[];
  publishedYear?: number | null;
  pageCount?: number | null;
  availabilityStatus: 'AVAILABLE' | 'ISSUED' | 'MAINTENANCE';
  avgRating: number;
  totalReviews: number;
  totalCopies: number;
  issuedCopies: number;
}

// ─── 10 Standard Library Genres ───────────────────────────────────────────
const LIBRARY_GENRES = [
  'Thriller',
  'Satire',
  'Psychology',
  'Fiction',
  'Poetry',
  'Drama',
  'Philosophy',
  'Politics',
  'Spirituality',
  'Self-Help'
] as const;

// ─── Sort Options ─────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { val: 'title', label: 'Title (A – Z)' },
  { val: 'title-desc', label: 'Title (Z – A)' },
  { val: 'author', label: 'Author (A – Z)' },
  { val: 'newest', label: 'Year (Newest)' },
  { val: 'oldest', label: 'Year (Oldest)' },
  { val: 'rating', label: 'Highest Rated' },
];

// ─── Book Card ────────────────────────────────────────────────────────────
const BookCard = forwardRef<HTMLDivElement, { book: BookItem }>(
  ({ book }, ref) => {
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
  }
);

BookCard.displayName = 'BookCard';

// ─── Main Page ────────────────────────────────────────────────────────────
export default function LibraryCatalogPage() {
  const [allBooks, setAllBooks] = useState<BookItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Filter and Sort states
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'ALL' | 'ENGLISH' | 'HINDI'>('ALL');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sort, setSort] = useState('title');
  const [sortOpen, setSortOpen] = useState(false);

  // Fetch full library catalog on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/library?limit=200', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && isMounted) {
          setAllBooks(data.books || []);
        }
      } catch (err) {
        console.error('Failed to load library books:', err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };
    fetchCatalog();
    return () => { isMounted = false; };
  }, []);

  // Compute genre counts based on the current language selection
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = { total: 0 };
    for (const b of allBooks) {
      if (selectedLanguage !== 'ALL') {
        const bLang = (b.language || '').toUpperCase();
        if (bLang !== selectedLanguage) continue;
      }
      counts.total++;
      if (b.genre && Array.isArray(b.genre)) {
        for (const g of b.genre) {
          const cleanG = g.trim();
          counts[cleanG] = (counts[cleanG] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allBooks, selectedLanguage]);

  // Real-time instant filtering & sorting with zero latency
  const displayedBooks = useMemo(() => {
    let result = [...allBooks];

    // 1. Language Filter
    if (selectedLanguage !== 'ALL') {
      result = result.filter(b => (b.language || '').toUpperCase() === selectedLanguage);
    }

    // 2. Genre Filter
    if (selectedGenre) {
      const targetGenre = selectedGenre.toLowerCase().trim();
      result = result.filter(b => 
        b.genre && Array.isArray(b.genre) && b.genre.some(g => g.toLowerCase().trim() === targetGenre)
      );
    }

    // 3. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(b => {
        const titleMatch = b.title.toLowerCase().includes(q);
        const authorMatch = b.author.toLowerCase().includes(q);
        const descMatch = b.description ? b.description.toLowerCase().includes(q) : false;
        const genreMatch = b.genre ? b.genre.some(g => g.toLowerCase().includes(q)) : false;
        return titleMatch || authorMatch || descMatch || genreMatch;
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sort === 'title') {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      }
      if (sort === 'title-desc') {
        return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      }
      if (sort === 'author') {
        return a.author.localeCompare(b.author, undefined, { sensitivity: 'base' });
      }
      if (sort === 'newest') {
        const yA = a.publishedYear ?? -9999;
        const yB = b.publishedYear ?? -9999;
        if (yB !== yA) return yB - yA;
        return a.title.localeCompare(b.title);
      }
      if (sort === 'oldest') {
        const yA = a.publishedYear ?? 9999;
        const yB = b.publishedYear ?? 9999;
        if (yA !== yB) return yA - yB;
        return a.title.localeCompare(b.title);
      }
      if (sort === 'rating') {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [allBooks, selectedLanguage, selectedGenre, search, sort]);

  const activeSortLabel = SORT_OPTIONS.find(o => o.val === sort)?.label || 'Title (A – Z)';

  const handleGenreClick = (genreName: string) => {
    if (selectedGenre === genreName) {
      setSelectedGenre('');
    } else {
      setSelectedGenre(genreName);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 pt-0 px-4 md:px-8 text-neutral-900 dark:text-neutral-100 font-sans">

      {/* Premium Banner SVG */}
      <div className="relative rounded-3xl overflow-hidden mb-8 w-full aspect-[1642/672] md:aspect-auto md:h-72 shadow-md border border-neutral-150 dark:border-neutral-900">
        <img
          src="/images/lib banner.svg"
          alt="Library Banner"
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      {/* Language Filter Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-neutral-50/80 dark:bg-neutral-900/60 p-2.5 md:p-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-neutral-500 ml-2 hidden sm:block" />
          <div className="flex gap-1.5 p-1 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200/50 dark:border-neutral-850 shadow-xs">
            {[
              { val: 'ALL', label: 'All Languages' },
              { val: 'ENGLISH', label: 'English' },
              { val: 'HINDI', label: 'हिन्दी (Hindi)' },
            ].map(tab => {
              const active = selectedLanguage === tab.val;
              return (
                <button
                  key={tab.val}
                  onClick={() => setSelectedLanguage(tab.val as 'ALL' | 'ENGLISH' | 'HINDI')}
                  className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'text-neutral-950 dark:text-white'
                      : 'text-neutral-450 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="langPill"
                      className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200/60 dark:border-neutral-700/60 z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-400 mr-2 font-medium">
          Showing <span className="font-semibold text-neutral-900 dark:text-white">{displayedBooks.length}</span> of {allBooks.length} volumes
        </div>
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Sidebar (Desktop) ───────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 sticky top-6 gap-1 bg-neutral-50/60 dark:bg-neutral-900/30 p-3 rounded-2xl border border-neutral-200/50 dark:border-neutral-850">
          <div className="flex items-center justify-between px-3 py-1 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Genres
            </span>
            {selectedGenre && (
              <button
                onClick={() => setSelectedGenre('')}
                className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* All Genres option */}
          <button
            onClick={() => setSelectedGenre('')}
            className={`relative w-full text-left py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between ${
              selectedGenre === ''
                ? 'font-semibold text-neutral-900 dark:text-white'
                : 'font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {selectedGenre === '' && (
              <motion.div
                layoutId="activeGenreDesktop"
                className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-xl z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">All Genres</span>
            <span className="relative z-10 text-[10px] opacity-60 tabular-nums font-mono">
              {genreCounts.total || 0}
            </span>
          </button>

          {/* 10 Standard Genres with live counts */}
          {LIBRARY_GENRES.map(g => {
            const active = selectedGenre === g;
            const count = genreCounts[g] || 0;
            return (
              <button
                key={g}
                onClick={() => handleGenreClick(g)}
                className={`relative w-full text-left py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  active
                    ? 'font-semibold text-neutral-900 dark:text-white'
                    : 'font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeGenreDesktop"
                    className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-xl z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{g}</span>
                <span className="relative z-10 text-[10px] opacity-60 tabular-nums font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* ── Main Content Area ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Mobile genre chips */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedGenre('')}
              className={`relative shrink-0 py-1.5 px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                selectedGenre === ''
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {selectedGenre === '' && (
                <motion.div
                  layoutId="activeGenreMobile"
                  className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-full z-0 border border-neutral-200/50 dark:border-neutral-700"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">All</span>
            </button>

            {LIBRARY_GENRES.map(g => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => handleGenreClick(g)}
                  className={`relative shrink-0 py-1.5 px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeGenreMobile"
                      className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-full z-0 border border-neutral-200/50 dark:border-neutral-700"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{g}</span>
                </button>
              );
            })}
          </div>

          {/* Controls: Search input & Sort Dropdown */}
          <div className="flex gap-3 items-center">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, author, or keyword…"
                className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 rounded-xl pl-9 pr-8 py-2 text-xs outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom Sort Dropdown */}
            <div className="relative shrink-0 ml-auto">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-neutral-750 dark:text-neutral-250 text-xs font-semibold rounded-xl px-4 py-2 outline-none hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer shadow-xs"
              >
                <span className="text-neutral-400 dark:text-neutral-500 font-normal">Sort:</span>
                <span>{activeSortLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-20 bg-transparent" onClick={() => setSortOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden"
                    >
                      {SORT_OPTIONS.map(opt => {
                        const active = sort === opt.val;
                        return (
                          <button
                            key={opt.val}
                            onClick={() => {
                              setSort(opt.val);
                              setSortOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                              active
                                ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-950 dark:text-white'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {active && <Check className="w-3.5 h-3.5 text-violet-500" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Book Catalog Grid */}
          {initialLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 animate-pulse overflow-hidden border border-neutral-100 dark:border-neutral-900">
                  <div className="aspect-[2/3] bg-neutral-100 dark:bg-neutral-900" />
                  <div className="p-4 space-y-2">
                    <div className="h-2.5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-3.5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-2.5 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {displayedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-24 text-center space-y-3 bg-neutral-50/40 dark:bg-neutral-900/20 rounded-3xl border border-neutral-200/50 dark:border-neutral-850">
              <BookOpen className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-700" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  No books match your criteria
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Try clearing the search query or selecting a different genre or language.
                </p>
              </div>
              {(selectedGenre || search || selectedLanguage !== 'ALL') && (
                <button
                  onClick={() => {
                    setSelectedGenre('');
                    setSearch('');
                    setSelectedLanguage('ALL');
                  }}
                  className="mt-2 text-xs font-semibold px-3.5 py-1.5 bg-neutral-200/60 dark:bg-neutral-800 hover:bg-neutral-300/60 dark:hover:bg-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
