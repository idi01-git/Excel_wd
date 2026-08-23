// src/app/(main)/community/library/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import Link from 'next/link';
import { Search, BookOpen, X, SlidersHorizontal, Check } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, LayoutGroup } from 'motion/react';
import SortDropdown from '@/components/SortDropdown';
import { getOptimizedCoverUrl } from '@/lib/image-optimization';
import { RevealButton } from '@/components/ui/RevealButton';

const smoothSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 25,
  mass: 1,
};

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

    const sx = useSpring(mx,  { stiffness: 200, damping: 25, mass: 0.5 });
    const sy = useSpring(my,  { stiffness: 200, damping: 25, mass: 0.5 });
    const sh = useSpring(hov, { stiffness: 220, damping: 26 });

    const rotX         = useTransform(sy, [-0.5, 0.5], [6, -6]);
    const rotY         = useTransform(sx, [-0.5, 0.5], [-6, 6]);
    const lift         = useTransform(sh, [0, 1], [0, -10]);
    const shade        = useTransform(sh, [0, 1], [
      '0 4px 16px rgba(0,0,0,0.08)',
      '0 24px 48px -8px rgba(0,0,0,0.22)'
    ]);
    const coverZoom      = useTransform(sh, [0, 1], [1, 1.05]);
    const coverOpacity   = useTransform(sh, [0, 1], [1, 0.8]);
    const overlayOpacity = useTransform(sh, [0, 1], [0, 1]);
    const detailsY       = useTransform(sh, [0, 1], [14, 0]);
    const detailsOpacity = useTransform(sh, [0, 1], [0, 1]);

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!localRef.current) return;
      const r = localRef.current.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width  - 0.5);
      my.set((e.clientY - r.top)  / r.height - 0.5);
    };

    const ratingScore = book.avgRating || 0;
    const isUnavailable = book.availabilityStatus !== 'AVAILABLE' || (book.totalCopies > 0 && book.issuedCopies >= book.totalCopies);

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="h-full"
      >
        <Link href={`/community/library/${book.id}`} className="block h-full outline-none group">
          <motion.div
            ref={localRef}
            onPointerMove={onMove}
            onPointerEnter={() => hov.set(1)}
            onPointerLeave={() => { hov.set(0); mx.set(0); my.set(0); }}
            style={{ rotateX: rotX, rotateY: rotY, y: lift, boxShadow: shade, transformStyle: 'preserve-3d' }}
            className="relative w-full aspect-[2/3] rounded-md overflow-hidden will-change-transform select-none bg-neutral-900 border border-neutral-200/50 dark:border-white/10"
          >
            {/* Bookmark Ribbon for Unavailable books */}
            {isUnavailable && (
              <div className="absolute top-0 right-3.5 z-30 w-7 h-24 bg-rose-700 text-white shadow-md flex flex-col items-center justify-start pt-2.5 [clip-path:polygon(0_0,100%_0,100%_100%,50%_88%,0_100%)] pointer-events-none">
                <span className="font-mono text-[8.5px] font-bold uppercase tracking-widest text-white [writing-mode:vertical-lr] rotate-180 select-none">
                  UNAVAILABLE
                </span>
              </div>
            )}

            {/* 1. Edge-to-Edge Cover Artwork (Silhouette stays visible on hover through 90% opaque overlay) */}
            <motion.img
              style={{ scale: coverZoom, opacity: coverOpacity }}
              src={book.coverImage ? getOptimizedCoverUrl(book.coverImage, 450) : 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'}
              alt={book.title}
              className={`absolute inset-0 w-full h-full object-cover object-center will-change-transform ${
                isUnavailable ? 'brightness-[0.55] grayscale-[35%]' : ''
              }`}
            />

            {/* Dark overlay for unavailable cover in default state */}
            {isUnavailable && (
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            )}

            {/* 2. Hovered Canvas Overlay (Light in light mode, Dark in dark mode — 20% more transparent so the cover silhouette reads through) */}
            <motion.div
              style={{ opacity: overlayOpacity }}
              className="absolute inset-0 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm pointer-events-none"
            />

            {/* 3. Hovered: Details Overlay */}
            <motion.div
              style={{ opacity: detailsOpacity, y: detailsY }}
              className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-left pointer-events-none z-10 text-neutral-950 dark:text-white"
            >
              {/* Spacer */}
              <div />

              {/* Title & Author Block */}
              <div className="my-auto py-2">
                <h3 className="font-serif text-[18px] sm:text-[21px] font-bold text-neutral-950 dark:text-white leading-[1.2] tracking-tight line-clamp-3">
                  {book.title}
                </h3>
                
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium italic mt-2">
                  {book.author}
                </p>
              </div>

              {/* 5-Star Rating Bar */}
              <div className="pt-3 border-t border-neutral-200/80 dark:border-white/10 w-full">
                {ratingScore > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {/* Theme-Adaptive Monochrome Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((starIndex) => {
                        const filled = starIndex <= Math.round(ratingScore);
                        return (
                          <svg
                            key={starIndex}
                            viewBox="0 0 24 24"
                            className={`w-3.5 h-3.5 shrink-0 ${
                              filled
                                ? 'fill-neutral-950 stroke-neutral-950 dark:fill-white dark:stroke-white'
                                : 'fill-transparent stroke-neutral-300 dark:stroke-neutral-700'
                            }`}
                            strokeWidth={1.5}
                            strokeLinejoin="round"
                          >
                            <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
                          </svg>
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-mono font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">
                      ({book.totalReviews})
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                    Unrated
                  </span>
                )}
              </div>
            </motion.div>
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
  // Progressive grid reveal: 24 covers initially, 24 more per "Show more" (multiples of 2, 3, and 4 so grid is always complete).
  // The live count always reflects the FULL filtered catalog.
  const [displayLimit, setDisplayLimit] = useState(24);

  // Filter and Sort states
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'ALL' | 'ENGLISH' | 'HINDI'>('ALL');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState('title');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

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

  // Compute genre counts based on current filters
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = { total: 0 };
    for (const b of allBooks) {
      if (selectedLanguage !== 'ALL') {
        const bLang = (b.language || '').toUpperCase();
        if (bLang !== selectedLanguage) continue;
      }
      if (onlyAvailable) {
        const isAvail = b.availabilityStatus === 'AVAILABLE' && (b.totalCopies === 0 || b.issuedCopies < b.totalCopies);
        if (!isAvail) continue;
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
  }, [allBooks, selectedLanguage, onlyAvailable]);

  // Real-time instant filtering & sorting with zero latency
  const displayedBooks = useMemo(() => {
    let result = [...allBooks];

    // 1. Language Filter
    if (selectedLanguage !== 'ALL') {
      result = result.filter(b => (b.language || '').toUpperCase() === selectedLanguage);
    }

    // 2. Available Only Filter
    if (onlyAvailable) {
      result = result.filter(b => b.availabilityStatus === 'AVAILABLE' && (b.totalCopies === 0 || b.issuedCopies < b.totalCopies));
    }

    // 3. Genre Filter
    if (selectedGenre) {
      const targetGenre = selectedGenre.toLowerCase().trim();
      result = result.filter(b => 
        b.genre && Array.isArray(b.genre) && b.genre.some(g => g.toLowerCase().trim() === targetGenre)
      );
    }

    // 4. Search Filter
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

    // 5. Sorting
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
  }, [allBooks, selectedLanguage, onlyAvailable, selectedGenre, search, sort]);

  const visibleBooks = displayedBooks.slice(0, displayLimit);
  const hasMore = displayLimit < displayedBooks.length;

  const handleGenreClick = (genreName: string) => {
    if (selectedGenre === genreName) {
      setSelectedGenre('');
    } else {
      setSelectedGenre(genreName);
    }
  };

  const activeFilterCount = (selectedLanguage !== 'ALL' ? 1 : 0) + (onlyAvailable ? 1 : 0);
  const hasActiveFilters = Boolean(search || selectedGenre || selectedLanguage !== 'ALL' || onlyAvailable);

  const handleResetFilters = () => {
    setSelectedGenre('');
    setSearch('');
    setIsSearchOpen(false);
    setSelectedLanguage('ALL');
    setOnlyAvailable(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 pt-6 md:pt-8 px-4 md:px-8 text-neutral-900 dark:text-neutral-100 font-sans">

      {/* ── 1. Original Banner ── */}
      <div className="relative rounded-2xl overflow-hidden mb-8 w-full aspect-[1642/672] md:aspect-auto md:h-72 shadow-sm border border-neutral-200/60 dark:border-neutral-900">
        <img
          src="/images/lib banner.svg"
          alt="Library Banner"
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      {/* ── 2. Master Top Action Strip (Borderless Luxury Design) ── */}
      <motion.div layout transition={smoothSpring} className="flex items-center justify-between gap-2.5 sm:gap-4 py-1 mb-8">
        
        {/* Left: Morphing Search Pill */}
        <motion.div layout transition={smoothSpring} className="flex items-center">
          {/* Smooth Morphing Search Pill */}
          <motion.div
            layout
            transition={smoothSpring}
            onClick={() => {
              if (!isSearchOpen) {
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 60);
              }
            }}
            className={`relative flex items-center h-9 rounded-full bg-neutral-100/80 hover:bg-neutral-200/60 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-neutral-900 dark:text-white transition-colors overflow-hidden ${
              isSearchOpen || search
                ? 'w-56 xs:w-64 sm:w-72 shadow-xs cursor-default'
                : 'w-24 sm:w-26 cursor-pointer justify-center'
            }`}
          >
            <motion.div layout className="flex items-center gap-2 px-3.5 w-full">
              <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0 pointer-events-none" />
              
              {!isSearchOpen && !search ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-300 select-none whitespace-nowrap"
                >
                  Search
                </motion.span>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex items-center min-w-0"
                >
                  <input
                    ref={searchInputRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search title, author, keyword…"
                    className="w-full bg-transparent pr-5 py-1 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setSearch('');
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
                    title="Close search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Controls: Filter Popover + Sort Dropdown */}
        <motion.div layout transition={smoothSpring} className="flex items-center gap-2">
          
          {/* Filter Popover Dropdown */}
          <div className="relative">
            <motion.button
              layout
              transition={smoothSpring}
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-1.5 h-9 rounded-full text-xs font-medium tracking-wide transition-colors cursor-pointer overflow-hidden ${
                isSearchOpen || search ? 'px-2.5 sm:px-4' : 'px-4'
              } ${
                activeFilterCount > 0 || filterOpen
                  ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                  : 'bg-neutral-100/80 hover:bg-neutral-200/60 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-200'
              }`}
              title="Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <motion.span layout className={isSearchOpen || search ? 'hidden sm:inline whitespace-nowrap' : 'inline whitespace-nowrap'}>
                Filters
              </motion.span>
              {activeFilterCount > 0 && (
                <motion.span layout className="w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center tabular-nums shrink-0">
                  {activeFilterCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {filterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setFilterOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    className="absolute right-0 top-full mt-2 w-64 p-4 rounded-2xl bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-2xl z-50 space-y-4 font-sans"
                  >
                    {/* Popover Header */}
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                      <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Filter Catalog
                      </span>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => {
                            setSelectedLanguage('ALL');
                            setOnlyAvailable(false);
                          }}
                          className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Availability Option with Pill Container & Smooth Toggle Switch */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Availability
                      </label>
                      <button
                        type="button"
                        onClick={() => setOnlyAvailable(!onlyAvailable)}
                        className={`w-full flex items-center justify-between p-2 px-3.5 rounded-full border text-xs font-medium transition-colors duration-200 cursor-pointer ${
                          onlyAvailable
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <span className="text-[12.5px]">Available Only</span>
                        
                        {/* Tactile Toggle Switch Pill */}
                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${
                          onlyAvailable ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                        }`}>
                          <motion.div
                            layout
                            transition={smoothSpring}
                            className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"
                          />
                        </div>
                      </button>
                    </div>

                    {/* Language Segmented Control with Pill Controls & Smooth Sliding Pill */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Language
                      </label>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/80 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/80">
                        <LayoutGroup id="library-filter-language">
                          {[
                            { val: 'ALL', label: 'All' },
                            { val: 'ENGLISH', label: 'English' },
                            { val: 'HINDI', label: 'हिन्दी' },
                          ].map(tab => {
                            const active = selectedLanguage === tab.val;
                            return (
                              <button
                                key={tab.val}
                                type="button"
                                onClick={() => setSelectedLanguage(tab.val as 'ALL' | 'ENGLISH' | 'HINDI')}
                                className={`relative py-1.5 px-3 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer text-center outline-none ${
                                  active
                                    ? 'text-white dark:text-neutral-950'
                                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                              >
                                {active && (
                                  <motion.div
                                    layoutId="active-language-pill"
                                    className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full shadow-xs z-0"
                                    transition={smoothSpring}
                                  />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                              </button>
                            );
                          })}
                        </LayoutGroup>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Dropdown */}
          <SortDropdown
            options={SORT_OPTIONS.map(o => ({ id: o.val, label: o.label }))}
            value={sort}
            onChange={setSort}
            onOpen={() => setFilterOpen(false)}
            compact={isSearchOpen || !!search}
          />
        </motion.div>
      </motion.div>

      {/* ── 3. Main Body: Left Genre Sidebar + Grid ── */}
      <div className="flex gap-8 items-start">

        {/* Desktop Genre Sidebar — pins just below the sticky Navbar (py-2 + h-16 + border ≈ 81px) */}
        <aside className="hidden md:flex flex-col w-48 shrink-0 sticky top-[96px] self-start">
          <div className="pb-2.5 mb-2.5 border-b-2 border-black/15 dark:border-white/15 px-1">
            <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-700 dark:text-neutral-300 block">
              GENRES
            </span>
          </div>

          <LayoutGroup id="library-genres-desktop">
            <div className="space-y-1">
              {/* All Genres option */}
              <button
                onClick={() => setSelectedGenre('')}
                className={`relative w-full text-left py-2 px-3.5 rounded-full text-[13px] font-sans transition-colors duration-200 outline-none cursor-pointer flex items-center justify-between group ${
                  selectedGenre === ''
                    ? 'text-white dark:text-neutral-950 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05] font-medium'
                }`}
              >
                {selectedGenre === '' && (
                  <motion.div
                    layoutId="activeGenreDesktop"
                    className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full z-0 shadow-xs"
                    transition={smoothSpring}
                  />
                )}
                <span className="relative z-10">
                  All
                </span>
                <span className={`relative z-10 font-mono text-[11px] tabular-nums ${
                  selectedGenre === '' ? 'text-white/80 dark:text-neutral-950/80 font-semibold' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
                }`}>
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
                    className={`relative w-full text-left py-2 px-3.5 rounded-full text-[13px] font-sans transition-colors duration-200 outline-none cursor-pointer flex items-center justify-between group ${
                      active
                        ? 'text-white dark:text-neutral-950 font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05] font-medium'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeGenreDesktop"
                        className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full z-0 shadow-xs"
                        transition={smoothSpring}
                      />
                    )}
                    <span className="relative z-10">
                      {g}
                    </span>
                    <span className={`relative z-10 font-mono text-[11px] tabular-nums ${
                      active ? 'text-white/80 dark:text-neutral-950/80 font-semibold' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Header Row above grid: Mobile genre chips slider & Live count */}
          <div className="flex items-center justify-between gap-3">
            {/* Mobile genre horizontal slider with smooth edge masks */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1 [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)]">
              <LayoutGroup id="library-genres-mobile">
                <button
                  onClick={() => setSelectedGenre('')}
                  className={`relative shrink-0 py-1.5 px-3.5 rounded-full text-xs font-sans transition-colors duration-200 outline-none cursor-pointer ${
                    selectedGenre === ''
                      ? 'text-white dark:text-neutral-950 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/80 dark:bg-white/[0.06] font-medium'
                  }`}
                >
                  {selectedGenre === '' && (
                    <motion.div
                      layoutId="activeGenreMobile"
                      className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full shadow-xs z-0"
                      transition={smoothSpring}
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
                      className={`relative shrink-0 py-1.5 px-3.5 rounded-full text-xs font-sans transition-colors duration-200 outline-none cursor-pointer ${
                        active
                          ? 'text-white dark:text-neutral-950 font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/80 dark:bg-white/[0.06] font-medium'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeGenreMobile"
                          className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full shadow-xs z-0"
                          transition={smoothSpring}
                        />
                      )}
                      <span className="relative z-10">{g}</span>
                    </button>
                  );
                })}
              </LayoutGroup>
            </div>

            {/* Live Count (Single Clean Number) */}
            <div className="font-mono text-xs text-neutral-400 dark:text-neutral-500 shrink-0 ml-auto flex items-center">
              <span className="font-bold text-neutral-900 dark:text-white tabular-nums">{displayedBooks.length}</span>
            </div>
          </div>

          {/* Book Catalog Grid */}
          {initialLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-neutral-100/60 dark:bg-neutral-900/60 animate-pulse overflow-hidden border border-neutral-200/40 dark:border-neutral-800">
                  <div className="aspect-[2/3] bg-neutral-200/60 dark:bg-neutral-800/60" />
                </div>
              ))}
            </div>
          ) : displayedBooks.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                <AnimatePresence mode="popLayout">
                  {visibleBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </AnimatePresence>
              </div>

              {/* ── SHOW MORE ── */}
              {hasMore ? (
                <div className="mt-12 flex flex-col items-center justify-center">
                  <RevealButton
                    label="Show more"
                    onClick={() => setDisplayLimit((prev) => Math.min(prev + 24, displayedBooks.length))}
                  />
                  <span className="mt-3 font-mono text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
                    {visibleBooks.length} / {displayedBooks.length}
                  </span>
                </div>
              ) : (
                <div className="mt-10 flex items-center justify-center gap-3 text-neutral-400 dark:text-neutral-600 font-mono text-[10px] uppercase tracking-[0.24em]">
                  <span className="h-px w-10 bg-neutral-300 dark:bg-neutral-700" />
                  <span>End of catalog</span>
                  <span className="h-px w-10 bg-neutral-300 dark:bg-neutral-700" />
                </div>
              )}
            </>
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
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-2 text-xs font-semibold px-4 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition shadow-sm cursor-pointer"
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
