'use client';

import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />;
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    
    // Fallback if View Transitions API is not supported or user prefers reduced motion
    // @ts-ignore
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme);
      return;
    }

    // @ts-ignore
    const transition = document.startViewTransition(async () => {
      flushSync(() => {
        setTheme(nextTheme);
      });
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0% at 50% 50%)`,
        `circle(150vmax at 50% 50%)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 1050,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-8 h-8 rounded-full border border-transparent hover:bg-gray-100/80 hover:border-gray-200/80 text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:text-white transition-all duration-200 cursor-pointer active:scale-90 select-none overflow-hidden"
      aria-label="Toggle Theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: -45, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 45, scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <SunIcon size={15} strokeWidth={2.2} className="text-white dark:text-neutral-100" />
          ) : (
            <MoonIcon size={15} strokeWidth={2.2} className="text-slate-800" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
