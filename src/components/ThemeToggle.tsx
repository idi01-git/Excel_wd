'use client';

import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />;
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = isDark ? 'light' : 'dark';
    
    // @ts-ignore - View Transitions API is not fully typed in all TS versions
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      // Force sync flush of theme change if possible
      // next-themes updates data-theme or class on HTML tag directly
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 400,
          easing: "ease-in-out",
          pseudoElement: isDark
            ? "::view-transition-old(root)"
            : "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-8 h-8 rounded-full border border-transparent hover:bg-gray-100 hover:border-gray-200 text-gray-500 hover:text-black transition-all duration-200"
      aria-label="Toggle Theme"
    >
      {isDark ? <SunIcon size={15} strokeWidth={2.2} /> : <MoonIcon size={15} strokeWidth={2.2} />}
    </button>
  );
}
