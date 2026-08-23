'use client';

import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = useCallback(
    async (event?: React.MouseEvent<HTMLButtonElement>) => {
      if (isTransitioningRef.current) return;
      const nextTheme = isDark ? 'light' : 'dark';

      // Fallback if View Transitions API is not supported or user prefers reduced motion
      const doc = document as ViewTransitionCapableDocument;
      if (
        !doc.startViewTransition ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setTheme(nextTheme);
        window.dispatchEvent(
          new CustomEvent('theme-change', { detail: { theme: nextTheme } })
        );
        return;
      }

      isTransitioningRef.current = true;

      // Origin coordinates for the circular expansion, from the clicked button
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      const targetElement = event?.currentTarget || buttonRef.current;
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if (event?.clientX && event?.clientY) {
        x = event.clientX;
        y = event.clientY;
      }

      // Radius that fully covers the farthest viewport corner — padded a
      // little so the circle's edge never visibly "searches" for the corner
      // near the end of the reveal.
      const endRadius =
        Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        ) + 40;

      try {
        const transition = doc.startViewTransition(async () => {
          flushSync(() => {
            setTheme(nextTheme);
          });
          if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
          }
          window.dispatchEvent(
            new CustomEvent('theme-change', { detail: { theme: nextTheme } })
          );
        });

        await transition.ready;

        // Silk-smooth full-screen circular reveal: 900ms symmetric
        // accelerate-decelerate curve. Slow start lets the circle bloom from
        // the button, the long glide covers the screen without a visible
        // velocity jump, and the gentle settle erases any edge shimmer.
        const animation = document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 900,
            easing: 'cubic-bezier(0.45, 0.05, 0.25, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );

        await animation.finished;
      } catch {
        setTheme(nextTheme);
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [isDark, setTheme]
  );

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-white/10 animate-pulse" />
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative flex items-center justify-center w-8 h-8 rounded-full border border-border/70 bg-background/80 hover:bg-foreground/5 hover:border-foreground/25 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer select-none overflow-hidden shadow-xs"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: -70, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 70, scale: 0.4, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 24,
            mass: 0.7,
          }}
          className="flex items-center justify-center pointer-events-none"
        >
          {isDark ? (
            <SunIcon size={15} strokeWidth={2.2} className="text-amber-300 dark:text-neutral-100" />
          ) : (
            <MoonIcon size={15} strokeWidth={2.2} className="text-slate-800 dark:text-slate-200" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
