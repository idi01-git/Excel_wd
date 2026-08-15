'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Eyebrow, FadeUp } from './primitives';

const NOISE_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  bg: string;
  accent: string;
  dark?: boolean;
}

const BOOKS: Book[] = [
  {
    id: 'VO-231',
    title: 'The Silent Architecture of Memory',
    author: 'Ed. Board · Essays',
    category: 'Essays',
    bg: 'linear-gradient(155deg,#1c1d22 0%,#0d0e12 100%)',
    accent: '#f3e8d2',
  },
  {
    id: 'VO-114',
    title: 'Echoes of the Monsoon',
    author: 'R. Vellum · Verse',
    category: 'Poetry',
    bg: 'linear-gradient(160deg,#a25a3d 0%,#6b3825 100%)',
    accent: '#fdf4e7',
  },
  {
    id: 'VO-902',
    title: 'If on a Winter’s Night',
    author: 'I. Calvino · Fiction',
    category: 'Fiction',
    bg: 'linear-gradient(150deg,#ece3d1 0%,#c9bba2 100%)',
    accent: '#221d15',
    dark: true,
  },
  {
    id: 'VO-337',
    title: 'Deep Forest Verse',
    author: 'S. Helix · Poetry',
    category: 'Poetry',
    bg: 'linear-gradient(155deg,#3f4a3a 0%,#222a20 100%)',
    accent: '#e8eedb',
  },
  {
    id: 'VO-772',
    title: 'Ficciones & Labyrinths',
    author: 'J.L. Borges · Classics',
    category: 'Classics',
    bg: 'linear-gradient(155deg,#b58b4f 0%,#6f5128 100%)',
    accent: '#fff3dc',
  },
  {
    id: 'VO-551',
    title: 'Neon Dreamers',
    author: 'K. Prim · Stories',
    category: 'Stories',
    bg: 'linear-gradient(160deg,#2a3446 0%,#131824 100%)',
    accent: '#dce8f8',
  },
  {
    id: 'VO-886',
    title: 'The Morning Slams',
    author: 'Collected · Spoken Word',
    category: 'Anthology',
    bg: 'linear-gradient(155deg,#8c5a4a 0%,#4a2e25 100%)',
    accent: '#f9ede0',
  },
];

function BookCard({ book, i }: { book: Book; i: number }) {
  const tilt = i % 2 === 0 ? 'md:-rotate-2' : 'md:rotate-2';
  return (
    <Link
      href="/community/library"
      className={`group relative block h-[420px] w-[280px] shrink-0 overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-3 md:h-[480px] md:w-[310px] ${tilt} hover:md:rotate-0`}
      style={{
        background: book.bg,
        color: book.accent,
        boxShadow:
          '0 24px 50px -18px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.10)',
      }}
    >
      {/* Spine highlight */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[10px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)',
        }}
      />
      {/* Content */}
      <div className="relative flex h-full flex-col justify-between p-6 md:p-7">
        <div className="flex items-start justify-between">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.24em] opacity-70"
            style={{ color: book.accent }}
          >
            {book.category}
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.14em] opacity-50"
            style={{ color: book.accent }}
          >
            {book.id}
          </span>
        </div>

        <div>
          <h3
            className="font-display text-[1.65rem] font-medium leading-[1.08] tracking-[-0.01em]"
            style={{ color: book.accent }}
          >
            {book.title}
          </h3>
          <p
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] opacity-60"
            style={{ color: book.accent }}
          >
            {book.author}
          </p>
          <div
            className="mt-5 inline-flex items-center gap-2 border-t pt-3 font-mono text-[10px] uppercase tracking-[0.22em] opacity-0 transition-all duration-500 group-hover:opacity-90"
            style={{ borderColor: `${book.accent}40`, color: book.accent }}
          >
            Borrow
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
      {/* Noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{ backgroundImage: NOISE_BG }}
      />
      {/* Hover gloss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
        }}
      />
    </Link>
  );
}

export default function LibraryShelf() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.4,
  });
  const x = useTransform(smooth, [0, 1], [0, -maxX]);
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      setMaxX(Math.max(0, trackRef.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative border-t border-border bg-background"
      style={{ height: maxX > 0 ? `calc(200vh + ${maxX}px)` : '260vh' }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {/* Ambient glow, echoes the hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 60%, color-mix(in oklab, var(--foreground) 6%, transparent) 0%, transparent 70%)',
          }}
        />

        {/* Header */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-24 md:px-10 md:pt-28">
          <FadeUp y={16}>
            <Eyebrow>The Shelf · Society Library</Eyebrow>
          </FadeUp>
          <FadeUp y={16} delay={0.1}>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Vol. 01 — {String(BOOKS.length).padStart(2, '0')}
            </span>
          </FadeUp>
        </div>

        {/* Horizontal track */}
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max items-center gap-8 pl-6 pr-[12vw] will-change-transform md:gap-12 md:pl-10"
        >
          {/* Intro panel */}
          <div className="w-[82vw] shrink-0 sm:w-[60vw] md:w-[38vw] lg:w-[32vw]">
            <FadeUp>
              <h2 className="font-display text-[clamp(2.6rem,6vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.03em] text-foreground">
                The society
                <br />
                <em className="font-normal italic">library.</em>
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Two hundred volumes of verse, fiction and criticism, lent with a
                handshake and a signature. Browse the catalogue, check a
                spine’s whereabouts, request a borrow.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/community/library"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity duration-200 hover:opacity-85"
                >
                  Browse catalogue
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href="/editors-shelf"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors duration-200 hover:border-foreground"
                >
                  Editor’s shelf
                </Link>
              </div>
              <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                200+ volumes · 1.2k borrows · Est. 2015
              </p>
            </FadeUp>
          </div>

          {/* Books */}
          {BOOKS.map((book, i) => (
            <BookCard key={book.id} book={book} i={i} />
          ))}

          {/* Outro */}
          <div className="flex w-[40vw] shrink-0 items-center justify-center md:w-[30vw]">
            <Link
              href="/community/library"
              className="group flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-full border border-border font-mono text-[10px] uppercase tracking-[0.22em] text-foreground transition-all duration-300 hover:border-foreground hover:bg-foreground hover:text-background md:h-44 md:w-44"
            >
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:rotate-45"
              />
              Full
              <br />
              catalogue
            </Link>
          </div>
        </motion.div>

        {/* Progress */}
        <div className="absolute inset-x-6 bottom-10 md:inset-x-10">
          <div className="h-px w-full bg-border">
            <motion.div
              style={{ scaleX: barScale }}
              className="h-px origin-left bg-foreground"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
