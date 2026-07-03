"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

interface ExpandableCardProps {
  /** Used to generate stable layoutIds — must be unique per card on the page. */
  id: string
  title: string
  src: string
  /** Short subtitle shown in the expanded header (e.g. "Article · John Doe") */
  description: string
  /**
   * Custom collapsed trigger. When provided, this node is wrapped in the
   * shared-layout motion div so it morphs into the expanded panel on click.
   * If omitted, falls back to the built-in compact tile.
   */
  trigger?: React.ReactNode
  /** Content shown inside the expanded panel below the cover image. */
  children?: React.ReactNode
  classNameExpanded?: string
}

export function ExpandableCard({
  id,
  title,
  src,
  description,
  trigger,
  children,
  classNameExpanded,
}: ExpandableCardProps) {
  const [active, setActive] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false)
    }
    const onClickOutside = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setActive(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onClickOutside)
    document.addEventListener("touchstart", onClickOutside)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onClickOutside)
      document.removeEventListener("touchstart", onClickOutside)
    }
  }, [])

  return (
    <>
      {/* ── Backdrop ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 bg-black/75 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[100] grid place-items-center sm:pt-16 px-4">
            <motion.div
              layoutId={`ec-card-${id}`}
              ref={cardRef}
              className={cn(
                "relative flex h-full w-full max-w-[780px] flex-col overflow-auto",
                "bg-slate-950 border border-white/10 shadow-2xl shadow-black/60",
                "sm:rounded-t-3xl [-ms-overflow-style:none] [scrollbar-width:none]",
                classNameExpanded
              )}
            >
              {/* Cover */}
              <motion.div layoutId={`ec-image-${id}`} className="shrink-0">
                <div className="relative before:absolute before:inset-x-0 before:bottom-0 before:z-10 before:h-20 before:bg-gradient-to-t before:from-slate-950">
                  <img src={src} alt={title} className="h-72 w-full object-cover object-center" />
                </div>
              </motion.div>

              {/* Header */}
              <div className="flex items-start justify-between px-8 pt-6 pb-2">
                <div>
                  <motion.p
                    layoutId={`ec-desc-${id}`}
                    className="text-sm font-medium text-gray-400"
                  >
                    {description}
                  </motion.p>
                  <motion.h3
                    layoutId={`ec-title-${id}`}
                    className="mt-1 text-3xl font-bold text-white font-serif leading-tight"
                  >
                    {title}
                  </motion.h3>
                </div>

                {/* Close */}
                <motion.button
                  layoutId={`ec-btn-${id}`}
                  aria-label="Close"
                  onClick={() => setActive(false)}
                  className="ml-4 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-gray-400 transition hover:border-white/20 hover:bg-slate-800 hover:text-white focus:outline-none"
                >
                  <motion.div animate={{ rotate: 45 }} transition={{ duration: 0.3 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" /><path d="M12 5v14" />
                    </svg>
                  </motion.div>
                </motion.button>
              </div>

              {/* Slot */}
              <div className="px-6 sm:px-8 pb-28">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="flex flex-col gap-4 text-sm text-gray-400"
                >
                  {children}
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Collapsed trigger ── */}
      {trigger ? (
        /* Custom trigger: wrap in a shared-layout div so it morphs correctly */
        <motion.div
          layoutId={`ec-card-${id}`}
          onClick={() => setActive(true)}
          className="cursor-pointer"
          style={{ borderRadius: 16 }}
        >
          {trigger}
        </motion.div>
      ) : (
        /* Default built-in tile */
        <motion.div
          layoutId={`ec-card-${id}`}
          onClick={() => setActive(true)}
          className="flex cursor-pointer flex-col rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 hover:border-white/20 hover:shadow-xl hover:shadow-violet-900/10 transition-all duration-300"
        >
          <motion.div layoutId={`ec-image-${id}`}>
            <img src={src} alt={title} className="w-full h-48 object-cover" />
          </motion.div>
          <div className="flex items-center justify-between p-4">
            <div className="min-w-0">
              <motion.p layoutId={`ec-desc-${id}`} className="text-xs text-gray-500 truncate">{description}</motion.p>
              <motion.h3 layoutId={`ec-title-${id}`} className="text-sm font-semibold text-white truncate font-serif">{title}</motion.h3>
            </div>
            <motion.div
              layoutId={`ec-btn-${id}`}
              className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5v14" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  )
}
