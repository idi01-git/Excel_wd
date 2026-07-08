"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, LayoutGroup } from "motion/react"
import { LayoutGrid, List, FileText, Star, MessageSquare, ArrowDownUp } from "lucide-react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import SortDropdown from "@/components/SortDropdown"

interface Publication {
  id: string
  title: string
  slug: string
  category: string
  coverImage?: string | null
  createdAt: string | Date
  readingTime: number
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
  bookmarks?: Publication[]
  isOwnProfile: boolean
}

type TabKey = "PUBLICATIONS" | "REVIEWS" | "COMMENTS" | "BOOKMARKS"

export default function AuthorCatalogue({
  initialPublications,
  bookReviews = [],
  comments = [],
  bookmarks = [],
  isOwnProfile,
}: AuthorCatalogueProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("PUBLICATIONS")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [visibleCount, setVisibleCount] = useState(6)
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most-liked" | "most-commented">("newest")

  const TABS = [
    { key: "PUBLICATIONS", label: "Works", icon: FileText, count: initialPublications.length },
    { key: "REVIEWS", label: "Reviews", icon: Star, count: bookReviews.length },
    { key: "COMMENTS", label: "Comments", icon: MessageSquare, count: comments.length },
    ...(isOwnProfile ? [{ key: "BOOKMARKS", label: "Bookmarks", icon: Star, count: bookmarks.length }] : [])
  ]

  const activeDataLength = 
    activeTab === "PUBLICATIONS" ? initialPublications.length : 
    activeTab === "REVIEWS" ? bookReviews.length : 
    activeTab === "COMMENTS" ? comments.length : 
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
  const sortedBookmarks = [...bookmarks].sort(sortFn)

  const visiblePublications = sortedPublications.slice(0, visibleCount)
  const visibleReviews = sortedReviews.slice(0, visibleCount)
  const visibleComments = sortedComments.slice(0, visibleCount)
  const visibleBookmarks = sortedBookmarks.slice(0, visibleCount)
  
  const hasMore = visibleCount < activeDataLength

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 6)
  }

  const handleTabSwitch = (key: TabKey) => {
    setActiveTab(key)
    setVisibleCount(6) // Reset pagination on tab switch
  }

  return (
    <section>
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 dark:border-neutral-800 pb-5 mb-8 gap-6">
        
        {/* Tab System */}
        <div className="flex flex-wrap gap-1.5 bg-gray-50 dark:bg-neutral-900 p-1 border border-gray-200/50 dark:border-neutral-800 rounded-full">
          <LayoutGroup id="author-tabs">
            {TABS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleTabSwitch(key as TabKey)}
                className={`relative py-1.5 px-4 rounded-full text-xs font-semibold tracking-wide transition-all outline-none ${
                  activeTab === key
                    ? "text-white dark:text-black"
                    : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                }`}
              >
                {activeTab === key && (
                  <motion.div
                    layoutId="active-tab-pill"
                    className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                  />
                )}
                <span className="relative z-10">
                  {label}
                  <span className="ml-1.5 opacity-60">({count})</span>
                </span>
              </button>
            ))}
          </LayoutGroup>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto">
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

          {/* View Toggle (For publications and bookmarks) */}
          {(activeTab === "PUBLICATIONS" || activeTab === "BOOKMARKS") && activeDataLength > 0 && (
            <div className="flex p-1 bg-gray-50 dark:bg-neutral-900 rounded-full w-fit border border-gray-200/50 dark:border-neutral-800 gap-0.5">
              <LayoutGroup id="author-catalogue-view">
                <button
                  onClick={() => setViewMode("list")}
                  className={`relative flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all rounded-full outline-none ${
                    viewMode === "list"
                      ? "text-white dark:text-black"
                      : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  {viewMode === "list" && (
                    <motion.div
                      layoutId="active-view-pill"
                      className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <List
                      size={14}
                      strokeWidth={1.8}
                      className={viewMode === "list" ? "scale-110" : ""}
                    />
                    List
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`relative flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all rounded-full outline-none ${
                    viewMode === "grid"
                      ? "text-white dark:text-black"
                      : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  {viewMode === "grid" && (
                    <motion.div
                      layoutId="active-view-pill"
                      className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <LayoutGrid
                      size={14}
                      strokeWidth={1.8}
                      className={viewMode === "grid" ? "scale-110" : ""}
                    />
                    Grid
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
          <motion.div
            layout
            className={
              (activeTab === "PUBLICATIONS" || activeTab === "BOOKMARKS") && viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 gap-8"
                : "flex flex-col gap-6"
            }
          >
            <AnimatePresence mode="popLayout">
              {/* PUBLICATIONS & BOOKMARKS TABS */}
              {(activeTab === "PUBLICATIONS" || activeTab === "BOOKMARKS") && 
                (activeTab === "PUBLICATIONS" ? visiblePublications : visibleBookmarks).map((pub) => {
                const dateStr = new Date(pub.createdAt).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" }
                )
                const cover =
                  pub.coverImage ||
                  "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop"

                return (
                  <motion.article
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                    key={`pub-${pub.id}`}
                    className={`group ${
                      viewMode === "list"
                        ? "flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-between border-b border-gray-200 dark:border-neutral-800 pb-8 last:border-0"
                        : "relative flex flex-col w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300"
                    }`}
                  >
                    <motion.div
                      layout
                      className={
                        viewMode === "list"
                          ? "flex flex-col flex-grow order-2 md:order-1"
                          : "p-5 flex flex-col flex-grow order-2"
                      }
                    >
                      <motion.div layout className="mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-cyan-400 bg-violet-50 dark:bg-cyan-950/30 px-2.5 py-1 rounded w-fit">
                          {pub.category}
                        </span>
                      </motion.div>
                      <motion.h3
                        layout
                        className={`${
                          viewMode === "list"
                            ? "font-serif text-2xl font-bold text-black dark:text-white mb-3 leading-tight"
                            : "font-serif text-xl font-bold text-black dark:text-white leading-tight mb-2 line-clamp-2"
                        } group-hover:text-violet-600 dark:group-hover:text-cyan-400 transition-colors`}
                      >
                        <Link href={`/publications/${pub.slug}`}>
                          {pub.title}
                        </Link>
                      </motion.h3>
                      <motion.p
                        layout
                        className={`${
                          viewMode === "list"
                            ? "text-gray-600 dark:text-neutral-400 text-sm md:text-base line-clamp-2 mb-4 leading-relaxed"
                            : "text-gray-600 dark:text-neutral-400 text-xs line-clamp-2 mb-4"
                        }`}
                      >
                        Read the full publication to discover more insights and perspectives.
                      </motion.p>
                      <motion.div
                        layout
                        className={`${
                          viewMode === "list"
                            ? "flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-500 font-medium uppercase tracking-wide mt-auto"
                            : "flex items-center gap-2 text-[10px] text-gray-500 dark:text-neutral-500 font-medium uppercase tracking-wide mt-auto pt-4 border-t border-gray-100 dark:border-neutral-800"
                        }`}
                      >
                        <span>{dateStr}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-600"></span>
                        <span>{pub.readingTime} min read</span>
                      </motion.div>
                    </motion.div>
                    <Link
                      href={`/publications/${pub.slug}`}
                      className={
                        viewMode === "list"
                          ? "block relative w-full md:w-48 lg:w-56 aspect-[3/2] overflow-hidden rounded-lg order-1 md:order-2 flex-shrink-0 border border-gray-100 dark:border-neutral-800"
                          : "block relative w-full aspect-[3/2] overflow-hidden order-1"
                      }
                    >
                      <motion.img
                        layout
                        src={cover}
                        alt={pub.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
                      />
                    </Link>
                  </motion.article>
                )
              })}

              {/* REVIEWS TAB */}
              {activeTab === "REVIEWS" && visibleReviews.map((review) => {
                const dateStr = new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                const cover = review.book.coverImage || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop"
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                    key={`review-${review.id}`}
                    className="flex flex-col sm:flex-row gap-5 items-start p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"
                  >
                    <div className="shrink-0 w-20 sm:w-24 aspect-[2/3] rounded-md overflow-hidden border border-gray-100 dark:border-neutral-800">
                       <img src={cover} alt={review.book.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-serif font-bold text-lg text-black dark:text-white line-clamp-1">{review.book.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-neutral-500 shrink-0">{dateStr}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-3">by {review.book.author}</p>
                      
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-neutral-700"} 
                          />
                        ))}
                      </div>

                      <p className="text-sm text-gray-700 dark:text-neutral-300 italic leading-relaxed">"{review.reviewText}"</p>
                    </div>
                  </motion.div>
                )
              })}

              {/* COMMENTS TAB */}
              {activeTab === "COMMENTS" && visibleComments.map((comment) => {
                const dateStr = new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                const targetTitle = comment.publication?.title || comment.editorShelf?.title || "Unknown post"
                const targetLink = comment.publication ? `/publications/${comment.publication.slug}` : comment.editorShelf ? `/editors-shelf/${comment.editorShelf.slug}` : "#"
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                    key={`comment-${comment.id}`}
                    className="p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={14} className="text-gray-400 dark:text-neutral-500" />
                      <span className="text-xs text-gray-500 dark:text-neutral-400">
                        Commented on{" "}
                        <Link href={targetLink} className="font-semibold text-black dark:text-white hover:underline">
                          {targetTitle}
                        </Link>
                      </span>
                      <span className="text-gray-300 dark:text-neutral-700 mx-1">•</span>
                      <span className="text-[10px] text-gray-400 dark:text-neutral-500">{dateStr}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-neutral-300">{comment.content}</p>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="ghost"
                onClick={handleShowMore}
                className="px-8 py-3 rounded-full border border-gray-200 dark:border-neutral-800 text-sm font-semibold tracking-wide uppercase text-black dark:text-white"
                showTooltip={false}
              >
                Show More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="py-16 text-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl bg-gray-50 dark:bg-neutral-900/30">
          <p className="text-gray-500 dark:text-neutral-500 font-serif italic text-lg">
            No {activeTab.toLowerCase()} found.
          </p>
        </div>
      )}
    </section>
  )
}
