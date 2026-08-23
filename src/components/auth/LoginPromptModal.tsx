'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LoginPromptModalProps {
  isOpen: boolean;
  action: string;
  onClose: () => void;
}

export function LoginPromptModal({ isOpen, action, onClose }: LoginPromptModalProps) {
  const pathname = usePathname();
  const callbackUrl = encodeURIComponent(pathname || '/');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close sign-in prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-in-prompt-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-sm border border-black/15 bg-white p-6 text-black shadow-2xl dark:border-white/20 dark:bg-black dark:text-white"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sign-in prompt"
              className="absolute right-3 top-3 grid size-8 place-items-center text-black/50 transition-colors hover:bg-black hover:text-white dark:text-white/50 dark:hover:bg-white dark:hover:text-black"
            >
              <X size={16} />
            </button>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50 dark:text-white/50">Excelsior</p>
            <h2 id="sign-in-prompt-title" className="mt-3 pr-8 font-serif text-2xl leading-tight">
              Sign in to {action}
            </h2>
            <p className="mt-2 text-sm text-black/65 dark:text-white/65">Create an account if you are new to Excelsior.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href={`/login?callbackUrl=${callbackUrl}`} className="flex min-h-11 items-center justify-center bg-black px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-black/75 dark:bg-white dark:text-black dark:hover:bg-white/80">
                Sign in
              </Link>
              <Link href={`/register?callbackUrl=${callbackUrl}`} className="flex min-h-11 items-center justify-center border border-black/25 px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-black hover:text-white dark:border-white/25 dark:hover:bg-white dark:hover:text-black">
                Create account
              </Link>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}