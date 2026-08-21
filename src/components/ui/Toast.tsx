'use client';

import { AnimatePresence, motion } from 'framer-motion';

export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  return <AnimatePresence>{message && <motion.button type="button" onClick={onClose} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 border border-black/20 bg-white px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-black shadow-lg dark:border-white/20 dark:bg-black dark:text-white">{message}</motion.button>}</AnimatePresence>;
}