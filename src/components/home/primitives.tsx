'use client';

import { useRef } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Eyebrow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {children}
    </span>
  );
}

/**
 * Word-by-word masked reveal.
 * Uses a latched `useInView` on the container (once) and state-driven
 * `animate` on the children — the reveal always runs to completion even if
 * the element leaves the viewport mid-delay (fast scrolling / flings).
 */
export function RevealWords({
  text,
  className = '',
  style,
  delay = 0,
  stagger = 0.045,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const show = reduce || inView;

  const words = text.split(' ');
  return (
    <span ref={ref} className={className} style={style} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden
          className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '115%' }}
            animate={
              reduce
                ? { y: '0%' }
                : show
                  ? { y: '0%' }
                  : { y: '115%' }
            }
            transition={{
              duration: 0.9,
              ease: EASE,
              delay: show ? delay + i * stagger : 0,
            }}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/**
 * Blur/rise fade-up wrapper with the same latched-in-view guarantee.
 */
export function FadeUp({
  children,
  delay = 0,
  y = 28,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? undefined : { opacity: 0, y, filter: 'blur(6px)' }}
      animate={
        reduce || inView
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : { opacity: 0, y, filter: 'blur(6px)' }
      }
      transition={{ duration: 0.9, ease: EASE, delay: inView || reduce ? delay : 0 }}
    >
      {children}
    </motion.div>
  );
}
