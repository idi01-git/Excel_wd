'use client';

import { useCallback, useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { FadeUp, RevealWords } from '@/components/home/primitives';
import { cn } from '@/lib/utils';
import PublicationCollection, {
  type PublicationItem,
  type ViewMode,
  ViewToggle,
} from '@/components/animated-collection';
import SortDropdown from '@/components/SortDropdown';
import FilterDropdown from '@/components/FilterDropdown';

const categories = ['All', 'Articles', 'Stories', 'Poems', 'Reviews'];

function PublicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentTopRef = useRef<HTMLDivElement>(null);

  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [view, setView] = useState<ViewMode>('list');
  const [sort, setSort] = useState<string>('latest');
  const [search, setSearch] = useState<string>('');
  const [language, setLanguage] = useState<string>('all');
  const [activeDropdown, setActiveDropdown] = useState<'sort' | 'filter' | null>(null);

  // In-memory query cache for instant 0ms category switching
  const cacheRef = useRef<Map<string, { publications: PublicationItem[]; total: number; totalPages: number; page: number }>>(new Map());

  const syncCategoryFromUrl = (value: string | null) => {
    if (!value) return 'All';

    const normalized = value.trim().toLowerCase();
    if (normalized === 'articles' || normalized === 'article') return 'Articles';
    if (normalized === 'stories' || normalized === 'story') return 'Stories';
    if (normalized === 'poems' || normalized === 'poem') return 'Poems';
    if (normalized === 'reviews' || normalized === 'review') return 'Reviews';

    return 'All';
  };

  const category = syncCategoryFromUrl(searchParams.get('category'));

  const getCacheKey = (c: string, s: string, q: string, l: string, p: number) => `${c}_${s}_${q}_${l}_${p}`;

  const updateCategory = (nextCategory: string) => {
    setActiveDropdown(null);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextCategory === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', nextCategory);
    }
    nextParams.delete('page');

    const queryString = nextParams.toString();
    router.replace(`/publications${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const fetchPublications = useCallback(async (pageNum = 1) => {
    const key = getCacheKey(category, sort, search, language, pageNum);
    const cached = cacheRef.current.get(key);

    if (cached) {
      // Instant Cache Hit: Display instantly in 0ms without showing loading skeleton
      setPublications(cached.publications);
      setPage(cached.page);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.set('category', category);
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      if (language && language !== 'all') params.set('language', language);
      params.set('page', pageNum.toString());
      params.set('limit', '9');

      const res = await fetch(`/api/publications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        const payload = {
          publications: data.publications,
          total: data.total || 0,
          totalPages: data.totalPages || Math.ceil((data.total || 0) / 9) || 1,
          page: data.page || pageNum,
        };
        cacheRef.current.set(key, payload);
        setPublications(payload.publications);
        setPage(payload.page);
        setTotal(payload.total);
        setTotalPages(payload.totalPages);
      }
    } catch (error) {
      console.error('Failed to load publications:', error);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, language]);

  useEffect(() => {
    void fetchPublications(page);
  }, [fetchPublications, page]);

  // Background prefetch other categories on idle so tab switching is instantaneous
  useEffect(() => {
    if (search) return;
    const otherCats = categories.filter((c) => c !== category);

    const timer = setTimeout(() => {
      for (const cat of otherCats) {
        const key = getCacheKey(cat, sort, '', language, 1);
        if (cacheRef.current.has(key)) continue;

        const params = new URLSearchParams();
        if (cat !== 'All') params.set('category', cat);
        if (sort) params.set('sort', sort);
        if (language && language !== 'all') params.set('language', language);
        params.set('page', '1');
        params.set('limit', '9');

        fetch(`/api/publications?${params.toString()}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              cacheRef.current.set(key, {
                publications: data.publications,
                total: data.total || 0,
                totalPages: data.totalPages || Math.ceil((data.total || 0) / 9) || 1,
                page: 1,
              });
            }
          })
          .catch(() => {});
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [category, sort, search, language]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveDropdown(null);
    setPage(1);
    fetchPublications(1);
  };

  const handleViewChange = (newView: ViewMode) => {
    setActiveDropdown(null);
    setView(newView);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page || nextPage < 1 || nextPage > totalPages || loading) return;
    setPage(nextPage);

    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) nextParams.delete('page');
    else nextParams.set('page', nextPage.toString());
    router.replace(`/publications${nextParams.toString() ? `?${nextParams.toString()}` : ''}`, { scroll: false });

    if (contentTopRef.current) {
      contentTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = (current: number, max: number) => {
    if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', max];
    if (current >= max - 3) return [1, '...', max - 4, max - 3, max - 2, max - 1, max];
    return [1, '...', current - 1, current, current + 1, '...', max];
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="relative pt-2 pb-2">
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
          <span
            aria-hidden
            className="absolute -right-4 -top-8 font-display text-[clamp(10rem,26vw,24rem)] font-medium leading-none tracking-[-0.05em] text-foreground/[0.055] dark:text-foreground/[0.12] md:-top-12"
          >
            ¶
          </span>
        </div>

        <div className="relative z-10">
          <div className="pb-10 md:pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="font-display text-[clamp(2.6rem,7vw,5.8rem)] font-medium leading-[0.95] tracking-[-0.03em] text-foreground">
                  <RevealWords text="Inked," delay={0.1} />{' '}
                  <em className="font-normal italic">
                    <RevealWords text="unbound." delay={0.3} />
                  </em>
                </h1>

                <FadeUp delay={0.35} className="mt-5">
                  <p className="max-w-lg text-sm md:text-base leading-relaxed text-muted-foreground font-sans">
                    Discover creative work, stories, poems, and critical reviews published by Excelsior members.
                  </p>
                </FadeUp>
              </div>

              <FadeUp delay={0.4} className="w-full md:w-auto shrink-0">
                <div className="flex items-center gap-2 w-full max-w-lg md:max-w-md">
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex flex-1 min-w-0 items-center bg-neutral-100/80 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/10 rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 focus-within:border-foreground dark:focus-within:border-foreground/60 transition-all duration-300 shadow-xs"
                  >
                    <Search size={15} className="text-muted-foreground mr-2 shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search titles, tags, authors..."
                      className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 text-xs md:text-sm outline-none min-w-0"
                    />
                    {search && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => {
                          setSearch('');
                          setPage(1);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors mr-1 shrink-0 rounded-full hover:bg-neutral-200/60 dark:hover:bg-white/10"
                      >
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="text-xs font-semibold text-foreground hover:text-muted-foreground transition shrink-0"
                    >
                      Search
                    </button>
                  </form>

                  {/* Desktop-Only Icon-Only Filter Button beside Search */}
                  <div className="hidden md:block shrink-0">
                    <FilterDropdown
                      iconOnly
                      options={[
                        { id: 'all', label: 'All Languages' },
                        { id: 'english', label: 'English' },
                        { id: 'hindi', label: 'Hindi' }
                      ]}
                      value={language}
                      isOpen={activeDropdown === 'filter'}
                      onOpenChange={(open) => setActiveDropdown(open ? 'filter' : null)}
                      onChange={(val) => {
                        setLanguage(val);
                        setPage(1);
                        setActiveDropdown(null);
                      }}
                    />
                  </div>

                  {/* Mobile-Only In-Line Controls (View Toggle & Sort Button) */}
                  <div className="flex md:hidden items-center gap-2 shrink-0">
                    <ViewToggle view={view} onChange={handleViewChange} />
                    <SortDropdown
                      compact
                      options={[
                        { id: 'latest', label: 'Latest' },
                        { id: 'popular', label: 'Popular (Likes)' },
                        { id: 'discussed', label: 'Most Discussed' }
                      ]}
                      value={sort}
                      isOpen={activeDropdown === 'sort'}
                      onOpenChange={(open) => setActiveDropdown(open ? 'sort' : null)}
                      onChange={(val) => {
                        setSort(val);
                        setPage(1);
                        setActiveDropdown(null);
                      }}
                    />
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>

          <div ref={contentTopRef} className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 dark:border-neutral-800 relative z-30">
            <FadeUp delay={0.48} y={12} className="flex items-center gap-2 w-full md:w-auto overflow-visible relative">
              <div className="flex flex-1 md:flex-initial items-center flex-nowrap gap-0.5 sm:gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-full min-w-0 overflow-x-auto [scrollbar-width:none]">
                <LayoutGroup id="category-pills">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateCategory(c)}
                      className={cn(
                        "relative py-1.5 px-3.5 sm:px-4 rounded-full text-xs font-semibold tracking-wide transition-colors outline-none cursor-pointer whitespace-nowrap shrink-0",
                        category === c
                          ? "text-white dark:text-neutral-950"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-foreground"
                      )}
                    >
                      {category === c && (
                        <motion.div
                          layoutId="active-category"
                          className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full shadow-xs"
                          transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                        />
                      )}
                      <span className="relative z-10">{c}</span>
                    </button>
                  ))}
                </LayoutGroup>
              </div>

              {/* Mobile-Only Filter Button in Category/Classification Row (Stacked below Sort) */}
              <div className="md:hidden shrink-0 relative z-40">
                <FilterDropdown
                  iconOnly
                  options={[
                    { id: 'all', label: 'All Languages' },
                    { id: 'english', label: 'English' },
                    { id: 'hindi', label: 'Hindi' }
                  ]}
                  value={language}
                  isOpen={activeDropdown === 'filter'}
                  onOpenChange={(open) => setActiveDropdown(open ? 'filter' : null)}
                  onChange={(val) => {
                    setLanguage(val);
                    setPage(1);
                    setActiveDropdown(null);
                  }}
                />
              </div>
            </FadeUp>

            {/* Desktop-Only Controls (Tabs & Sort Dropdown) */}
            <FadeUp delay={0.52} y={12} className="hidden md:flex items-center gap-3">
              <ViewToggle view={view} onChange={handleViewChange} />
              <SortDropdown
                options={[
                  { id: 'latest', label: 'Latest' },
                  { id: 'popular', label: 'Popular (Likes)' },
                  { id: 'discussed', label: 'Most Discussed' }
                ]}
                value={sort}
                isOpen={activeDropdown === 'sort'}
                onOpenChange={(open) => setActiveDropdown(open ? 'sort' : null)}
                onChange={(val) => {
                  setSort(val);
                  setPage(1);
                  setActiveDropdown(null);
                }}
              />
            </FadeUp>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "w-full pt-6",
              view === "list"
                ? "flex flex-col gap-3.5 sm:gap-5 md:gap-6"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            )}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className={cn(
                  "bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 rounded-2xl md:rounded-3xl animate-pulse overflow-hidden",
                  view === "list" ? "h-28 sm:h-36 md:h-48" : "h-80 sm:h-[340px]"
                )}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`collection-page-${page}-${category}-${sort}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="relative pt-6"
          >
            <PublicationCollection publications={publications} view={view} onViewChange={setView} />

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t border-neutral-200/80 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  Showing <span className="font-bold text-neutral-900 dark:text-neutral-100">{Math.min((page - 1) * 9 + 1, total)}–{Math.min(page * 9, total)}</span> of <span className="font-bold text-neutral-900 dark:text-neutral-100">{total}</span> publications
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || loading}
                    aria-label="Previous page"
                    className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden xs:inline">Prev</span>
                  </button>

                  {getPageNumbers(page, totalPages).map((p, idx) =>
                    typeof p === 'number' ? (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        disabled={loading}
                        className={cn(
                          "h-9 min-w-9 px-2 rounded-full text-xs font-semibold transition cursor-pointer font-mono",
                          page === p
                            ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
                            : "border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        )}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-neutral-400 select-none">
                        ...
                      </span>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages || loading}
                    aria-label="Next page"
                    className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer gap-1"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PublicationsPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div>}>
      <PublicationsContent />
    </Suspense>
  );
}
