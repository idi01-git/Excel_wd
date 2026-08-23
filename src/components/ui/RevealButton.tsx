'use client';

import { motion } from 'motion/react';

/**
 * Canonical "Load more / Show more / Unfold" text button — same design
 * language as the site's pill buttons (Editor's Shelf / Explore Library):
 *   • solid --foreground pill with --background text (inverts day/night)
 *   • mono uppercase tracking, light-sweep shimmer gliding across on hover
 *   • springy scale + lift on hover, tactile press on tap
 */
export function RevealButton({
  label = 'Load more',
  onClick,
  disabled = false,
  loading = false,
  className = '',
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { scale: 1.04, y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`group relative inline-flex items-center gap-2.5 rounded-full bg-foreground px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer select-none disabled:opacity-60 disabled:cursor-default disabled:pointer-events-none ${className}`}
    >
      {/* Ambient light sweep shimmer on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 dark:via-black/25 to-transparent pointer-events-none" />

      <span className="relative z-10 tabular-nums">
        {loading ? 'Loading…' : label}
      </span>

      {loading && (
        <span className="relative z-10 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
    </motion.button>
  );
}
