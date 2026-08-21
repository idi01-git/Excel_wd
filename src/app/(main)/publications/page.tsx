'use client';

import { useCallback, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Search } from 'lucide-react';
import { FadeUp, RevealWords } from '@/components/home/primitives';
import { cn } from '@/lib/utils';
import PublicationCollection, {
  type PublicationItem,
  type ViewMode,
  ViewToggle,
} from '@/components/animated-collection';
import SortDropdown from '@/components/SortDropdown';

const categories = ['All', 'Articles', 'Stories', 'Poems', 'Reviews'];

function PublicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [view, setView] = useState<ViewMode>('list');
  const [sort, setSort] = useState<string>('latest');
  const [search, setSearch] = useState<string>('');

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

  const updateCategory = (nextCategory: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextCategory === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', nextCategory);
    }

    const queryString = nextParams.toString();
    router.replace(`/publications${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const fetchPublications = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (category && category !== 'All') params.set('category', category);
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      params.set('page', pageNum.toString());
      params.set('limit', '5');

      const res = await fetch(`/api/publications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        if (append) {
          setPublications((prev) => [...prev, ...data.publications]);
        } else {
          setPublications(data.publications);
        }
        setHasMore(data.hasMore);
        setPage(data.page);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to load publications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, search, sort]);

  useEffect(() => {
    setPage(1);
    void fetchPublications(1, false);
  }, [fetchPublications]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPublications(1, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    void fetchPublications(page + 1, true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* ── TOP SECTION (Hero + Filter Toolbar with flowing ghost watermark) ── */}
      <div className="relative pt-2 pb-2">
        {/* Ghost background character */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
          <span
            aria-hidden
            className="absolute -right-4 -top-8 font-display text-[clamp(10rem,26vw,24rem)] font-medium leading-none tracking-[-0.05em] text-foreground/[0.055] dark:text-foreground/[0.12] md:-top-12"
          >
            ¶
          </span>
        </div>

        <div className="relative z-10">
          {/* Hero text & Search */}
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

              {/* Editorial Search Bar */}
              <FadeUp delay={0.4} className="w-full md:w-auto shrink-0">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex max-w-md w-full items-center bg-neutral-100/80 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/10 rounded-full px-4 py-2.5 focus-within:border-foreground dark:focus-within:border-foreground/60 transition-all duration-300 shadow-xs"
                >
                  <Search size={15} className="text-muted-foreground mr-2 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search titles, tags, topics..."
                    className="w-full bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="submit"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground hover:text-muted-foreground transition-colors cursor-pointer ml-2"
                  >
                    Search
                  </button>
                </form>
              </FadeUp>
            </div>
          </div>

          {/* Filter Tabs & Controls (View Mode Toggle + Sort) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-neutral-200/60 dark:border-neutral-800 pb-5">
            <FadeUp delay={0.45} y={12}>
              <div className="flex flex-wrap gap-1.5 bg-neutral-100/80 dark:bg-white/[0.06] p-1 border border-neutral-200/50 dark:border-white/10 rounded-full">
                <LayoutGroup id="publications-category-tabs">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateCategory(c)}
                      className={`relative py-1.5 px-4 rounded-full text-xs font-semibold tracking-wide transition-all outline-none cursor-pointer ${
                        category === c
                          ? 'text-white dark:text-neutral-950'
                          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                      }`}
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
            </FadeUp>

            {/* Right side: View Toggle + Sort Dropdown */}
            <FadeUp delay={0.52} y={12}>
              <div className="flex items-center gap-3">
                <ViewToggle view={view} onChange={setView} />
                <SortDropdown
                  options={[
                    { id: 'latest', label: 'Latest' },
                    { id: 'popular', label: 'Popular (Likes)' },
                    { id: 'discussed', label: 'Most Discussed' }
                  ]}
                  value={sort}
                  onChange={(val) => setSort(val)}
                />
              </div>
            </FadeUp>
          </div>
        </div>
      </div>

      {/* Content Area with Smooth Crossfade Entrance */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "w-full",
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
                  view === "list" ? "h-32 sm:h-44 md:h-52" : "h-80 sm:h-[340px]"
                )}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="collection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <PublicationCollection publications={publications} view={view} onViewChange={setView} />

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12 mb-6">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-semibold text-xs uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Loading works...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Works</span>
                      {total > publications.length && (
                        <span className="opacity-70 text-[10px] font-mono">
                          ({total - publications.length} remaining)
                        </span>
                      )}
                    </>
                  )}
                </button>
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
    <Suspense fallback={<div className="w-full max-w-6xl mx-auto py-8">Loading...</div>}>
      <PublicationsContent />
    </Suspense>
  );
}

