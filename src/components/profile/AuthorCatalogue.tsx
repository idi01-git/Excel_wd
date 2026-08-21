"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react"
import { LayoutGrid, List, FileText, Star, MessageSquare, Heart, Bookmark } from "lucide-react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import SortDropdown from "@/components/SortDropdown"

const smoothSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
  mass: 1,
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

interface Publication {
  id: string
  title: string
  slug: string
  category: string
  coverImage?: string | null
  createdAt: string | Date
  readingTime: number
}

function ProfilePublicationCard({ pub, viewMode }: { pub: Publication; viewMode: "list" | "grid" }) {
  const cardRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Exact Awwwards-level interactive spring physics from publications page
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const hov = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 220, damping: 28, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 220, damping: 28, mass: 0.5 });
  const sh = useSpring(hov, { stiffness: 200, damping: 26 });

  // 3D subtle tilt
  const rotX = useTransform(sy, [-0.5, 0.5], [4.5, -4.5]);
  const rotY = useTransform(sx, [-0.5, 0.5], [-4.5, 4.5]);

  // Spring scale & lift
  const cardScale = useTransform(sh, [0, 1], [1, 1.018]);
  const cardLift = useTransform(sh, [0, 1], [0, -5]);

  // Image zoom and subtle parallax
  const imgZoom = useTransform(sh, [0, 1], [1, 1.08]);
  const imgX = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const imgY = useTransform(sy, [-0.5, 0.5], [-5, 5]);

  // Layered luxury shadow lift
  const shadowLift = useTransform(
    sh,
    [0, 1],
    [
      "0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)",
      "0 24px 50px -12px rgba(0, 0, 0, 0.14), 0 10px 24px -6px rgba(0, 0, 0, 0.06)",
    ]
  );

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onPointerEnter = () => {
    hov.set(1);
  };

  const onPointerLeave = () => {
    hov.set(0);
    mx.set(0);
    my.set(0);
  };

  const dateStr = formatDate(pub.createdAt);
  const cover =
    pub.coverImage ||
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop";

  return (
    <motion.article
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      key={`pub-${pub.id}`}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{
        perspective: 1200,
        rotateX: reduce ? 0 : rotX,
        rotateY: reduce ? 0 : rotY,
        scale: reduce ? 1 : cardScale,
        y: reduce ? 0 : cardLift,
        boxShadow: shadowLift,
        transformStyle: "preserve-3d",
      }}
      className={`group relative overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200/70 dark:border-neutral-800 transition-colors duration-300 will-change-transform cursor-pointer ${
        viewMode === "list"
          ? "flex flex-row items-stretch rounded-2xl md:rounded-3xl"
          : "flex flex-col rounded-3xl"
      }`}
    >
      {/* Cover Thumbnail */}
      <Link
        href={`/publications/${pub.slug}`}
        className={`${
          viewMode === "list"
            ? "w-28 xs:w-36 sm:w-48 md:w-56 aspect-square sm:aspect-[4/3] shrink-0 border-r border-gray-100 dark:border-neutral-800 relative overflow-hidden block"
            : "w-full aspect-[16/10] border-b border-gray-100 dark:border-neutral-800 shrink-0 relative overflow-hidden block"
        }`}
      >
        <motion.div
          style={{
            scale: reduce ? 1 : imgZoom,
            x: reduce ? 0 : imgX,
            y: reduce ? 0 : imgY,
          }}
          className="w-full h-full will-change-transform transform-gpu"
        >
          <img
            src={cover}
            alt={pub.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <span className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-white/90 dark:bg-neutral-950/80 backdrop-blur-md border-gray-200/60 dark:border-neutral-700/60 text-violet-600 dark:text-cyan-400 shadow-xs transition-transform duration-300 group-hover:scale-105">
          {pub.category}
        </span>
      </Link>

      {/* Content Details */}
      <div
        className={`flex flex-col flex-1 justify-between min-w-0 ${
          viewMode === "list" ? "p-3.5 sm:p-5 md:p-6" : "p-4 sm:p-5"
        }`}
      >
        <div>
          <h3
            className={`${
              viewMode === "list"
                ? "font-serif text-sm sm:text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 mb-1.5 group-hover:text-violet-600 dark:group-hover:text-cyan-400 transition-colors"
                : "font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 mb-2 group-hover:text-violet-600 dark:group-hover:text-cyan-400 transition-colors"
            }`}
          >
            <Link href={`/publications/${pub.slug}`}>
              {pub.title}
            </Link>
          </h3>
          <p
            className={`text-gray-600 dark:text-neutral-400 text-xs leading-relaxed font-sans ${
              viewMode === "list" ? "line-clamp-1 sm:line-clamp-2 mb-2.5" : "line-clamp-2 mb-3"
            }`}
          >
            Read the full publication on Excelsior to discover creative perspectives and discussions.
          </p>
        </div>

        <div
          className={`flex items-center gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500 font-medium uppercase tracking-wide mt-auto ${
            viewMode === "list" ? "pt-1.5 sm:pt-2" : "pt-3 border-t border-gray-100 dark:border-neutral-800"
          }`}
        >
          <span>{dateStr}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-600"></span>
          <span>{pub.readingTime} min read</span>
        </div>
      </div>
    </motion.article>
  );
}

interface BookReview {
  id: string
  rating: number
  reviewText: string
  createdAt: string | Date
  book: {
    id: string
    title: string
    coverImage: string | null
    author: string
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string | Date
  publication?: {
    title: string
    slug: string
  } | null
  editorShelf?: {
    title: string
    slug: string
  } | null
}

interface AuthorCatalogueProps {
  initialPublications: Publication[]
  bookReviews?: BookReview[]
  comments?: Comment[]
  liked?: Publication[]
  bookmarks?: Publication[]
  isOwnProfile: boolean
}

type TabKey = "PUBLICATIONS" | "REVIEWS" | "COMMENTS" | "LIKED" | "BOOKMARKS"

export default function AuthorCatalogue({
  initialPublications,
  bookReviews = [],
  comments = [],
  liked = [],
  bookmarks = [],
  isOwnProfile,
}: AuthorCatalogueProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("PUBLICATIONS")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [visibleCount, setVisibleCount] = useState(5)
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most-liked" | "most-commented">("newest")

  const TABS = [
    { key: "PUBLICATIONS" as const, label: "Works", icon: FileText, count: initialPublications.length },
    { key: "REVIEWS" as const, label: "Reviews", icon: Star, count: bookReviews.length },
    { key: "COMMENTS" as const, label: "Comments", icon: MessageSquare, count: comments.length },
    { key: "LIKED" as const, label: "Liked", icon: Heart, count: liked.length },
  ]

  const activeDataLength = 
    activeTab === "PUBLICATIONS" ? initialPublications.length : 
    activeTab === "REVIEWS" ? bookReviews.length : 
    activeTab === "COMMENTS" ? comments.length : 
    activeTab === "LIKED" ? liked.length :
    bookmarks.length

  // Sorting logic
  const sortFn = (a: any, b: any) => {
    if (sortBy === "most-liked") {
      const aLikes = a._count?.interactions || a.likesCount || 0
      const bLikes = b._count?.interactions || b.likesCount || 0
      return bLikes - aLikes
    }
    if (sortBy === "most-commented") {
      const aComments = a._count?.comments || a.commentsCount || 0
      const bComments = b._count?.comments || b.commentsCount || 0
      return bComments - aComments
    }
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortBy === "oldest" ? dateA - dateB : dateB - dateA
  }

  const sortedPublications = [...initialPublications].sort(sortFn)
  const sortedReviews = [...bookReviews].sort(sortFn)
  const sortedComments = [...comments].sort(sortFn)
  const sortedLiked = [...liked].sort(sortFn)
  const sortedBookmarks = [...bookmarks].sort(sortFn)

  const visiblePublications = sortedPublications.slice(0, visibleCount)
  const visibleReviews = sortedReviews.slice(0, visibleCount)
  const visibleComments = sortedComments.slice(0, visibleCount)
  const visibleLiked = sortedLiked.slice(0, visibleCount)
  const visibleBookmarks = sortedBookmarks.slice(0, visibleCount)
  
  const hasMore = visibleCount < activeDataLength

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5)
  }

  const handleTabSwitch = (key: TabKey) => {
    setActiveTab(key)
    setVisibleCount(5) // Reset pagination on tab switch
  }

  const isPublicationView = activeTab === "PUBLICATIONS" || activeTab === "BOOKMARKS" || activeTab === "LIKED"

  return (
    <section>
      {/* Header & Tabs Bar (All visible in one glance, zero horizontal scrolling) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-5 mb-8 gap-4">
        
        {/* Left Side: [Main Tab Pill Selector] + [Bookmark Button Permanently Beside Tabs] */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between sm:justify-start">
          {/* Main Tab Pill Selector (Works, Reviews, Comments, Liked) */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-neutral-900 border border-gray-200/50 dark:border-neutral-800 rounded-full flex-grow sm:flex-grow-0 justify-between sm:justify-start">
            <LayoutGroup id="author-tabs">
              {TABS.map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTabSwitch(key)}
                  className={`relative flex-1 sm:flex-initial py-1.5 px-3 sm:px-4 rounded-full text-xs font-semibold tracking-tight transition-colors outline-none whitespace-nowrap cursor-pointer text-center ${
                    activeTab === key
                      ? "text-white dark:text-black"
                      : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {activeTab === key && (
                    <motion.div
                      layoutId="active-tab-pill"
                      className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-xs"
                      transition={smoothSpring}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1">
                    <span>{label}</span>
                    <span className="text-[11px] opacity-60">({count})</span>
                  </span>
                </button>
              ))}
            </LayoutGroup>
          </div>

          {/* Bookmark Button permanently fixed on the right side of the tab bar */}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => handleTabSwitch(activeTab === "BOOKMARKS" ? "PUBLICATIONS" : "BOOKMARKS")}
              className={`relative flex items-center justify-center h-9 w-9 rounded-full border transition-all cursor-pointer shrink-0 ${
                activeTab === "BOOKMARKS"
                  ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-xs"
                  : "bg-neutral-100/80 hover:bg-neutral-200/60 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-neutral-600 dark:text-neutral-400 border-neutral-200/50 dark:border-white/10"
              }`}
              title={activeTab === "BOOKMARKS" ? "Active Bookmarks" : `Bookmarks (${bookmarks.length})`}
            >
              <Bookmark
                size={14}
                className={activeTab === "BOOKMARKS" ? "fill-current" : ""}
              />
              {bookmarks.length > 0 && activeTab !== "BOOKMARKS" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 dark:bg-cyan-500 text-[9px] font-bold text-white flex items-center justify-center tabular-nums shadow-xs">
                  {bookmarks.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Actions: Sort Dropdown and Layout Switch */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Sort Dropdown */}
          {activeDataLength > 0 && (
            <SortDropdown
              options={[
                { id: "newest", label: "Newest First" },
                { id: "oldest", label: "Oldest First" },
                { id: "most-liked", label: "Most Liked" },
                { id: "most-commented", label: "Most Commented" }
              ]}
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
            />
          )}

          {/* Layout View Toggle (Matching Publications Page exactly) */}
          {isPublicationView && activeDataLength > 0 && (
            <div className="inline-flex p-0.5 bg-neutral-100/80 dark:bg-white/[0.06] rounded-full border border-neutral-200/50 dark:border-white/10 shrink-0">
              <LayoutGroup id="profile-view-toggle">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all rounded-full outline-none cursor-pointer ${
                    viewMode === "list"
                      ? "text-white dark:text-neutral-950"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                  title="List view"
                >
                  {viewMode === "list" && (
                    <motion.div
                      layoutId="profile-active-view-pill"
                      className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full shadow-xs"
                      transition={smoothSpring}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <List size={13} strokeWidth={2} />
                    <span className="hidden xs:inline">List</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all rounded-full outline-none cursor-pointer ${
                    viewMode === "grid"
                      ? "text-white dark:text-neutral-950"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                  title="Grid view"
                >
                  {viewMode === "grid" && (
                    <motion.div
                      layoutId="profile-active-view-pill"
                      className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full shadow-xs"
                      transition={smoothSpring}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <LayoutGrid size={13} strokeWidth={2} />
                    <span className="hidden xs:inline">Grid</span>
                  </span>
                </button>
              </LayoutGroup>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeDataLength > 0 ? (
        <>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${activeTab}-${viewMode}`}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={
                isPublicationView
                  ? viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
                    : "flex flex-col gap-3.5 sm:gap-4.5"
                  : "flex flex-col gap-4 sm:gap-5"
              }
            >
              {/* PUBLICATIONS, LIKED & BOOKMARKS TABS */}
              {isPublicationView && 
                (activeTab === "PUBLICATIONS" 
                  ? visiblePublications 
                  : activeTab === "LIKED"
                  ? visibleLiked
                  : visibleBookmarks
                ).map((pub) => (
                  <ProfilePublicationCard key={`pub-${pub.id}`} pub={pub} viewMode={viewMode} />
                ))}

              {/* REVIEWS TAB */}
              {activeTab === "REVIEWS" && visibleReviews.map((review) => {
                const dateStr = formatDate(review.createdAt)
                const cover = review.book.coverImage || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop"
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -3, scale: 1.008 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                    key={`review-${review.id}`}
                    className="flex flex-col xs:flex-row gap-4 sm:gap-5 items-start p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="shrink-0 w-16 xs:w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-800">
                       <img src={cover} alt={review.book.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-grow min-w-0 w-full">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-serif font-bold text-base sm:text-lg text-black dark:text-white line-clamp-1 break-words">{review.book.title}</h4>
                        <span className="text-[11px] sm:text-xs text-gray-500 dark:text-neutral-500 shrink-0">{dateStr}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-2.5">by {review.book.author}</p>
                      
                      <div className="flex gap-1 mb-2.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={13} 
                            className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-neutral-700"} 
                          />
                        ))}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-700 dark:text-neutral-300 italic leading-relaxed">"{review.reviewText}"</p>
                    </div>
                  </motion.div>
                )
              })}

              {/* COMMENTS TAB */}
              {activeTab === "COMMENTS" && visibleComments.map((comment) => {
                const dateStr = formatDate(comment.createdAt)
                const targetTitle = comment.publication?.title || comment.editorShelf?.title || "Unknown post"
                const targetLink = comment.publication ? `/publications/${comment.publication.slug}` : comment.editorShelf ? `/editors-shelf/${comment.editorShelf.slug}` : "#"
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -2, scale: 1.006 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                    key={`comment-${comment.id}`}
                    className="p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-900 transition-colors shadow-xs hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2.5">
                      <MessageSquare size={13} className="text-gray-400 dark:text-neutral-500 shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-neutral-400">
                        Commented on{" "}
                        <Link href={targetLink} className="font-semibold text-black dark:text-white hover:underline">
                          {targetTitle}
                        </Link>
                      </span>
                      <span className="text-gray-300 dark:text-neutral-700 mx-0.5">•</span>
                      <span className="text-[10px] text-gray-400 dark:text-neutral-500">{dateStr}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">{comment.content}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 sm:mt-10 flex justify-center">
              <Button
                variant="ghost"
                onClick={handleShowMore}
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border border-gray-200 dark:border-neutral-800 text-xs sm:text-sm font-semibold tracking-wide uppercase text-black dark:text-white flex items-center gap-2"
                showTooltip={false}
              >
                <span>Load More</span>
                <span className="text-[10px] opacity-70 font-mono">
                  ({activeDataLength - visibleCount} remaining)
                </span>
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 sm:py-16 text-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl bg-gray-50 dark:bg-neutral-900/30">
          <p className="text-gray-500 dark:text-neutral-500 font-serif italic text-base sm:text-lg">
            No {activeTab.toLowerCase()} found.
          </p>
        </div>
      )}
    </section>
  )
}
