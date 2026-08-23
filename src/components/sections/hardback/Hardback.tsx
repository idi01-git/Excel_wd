'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import {
  BOOKS,
  BookData,
  INITIAL_INDEX,
  OPEN_DURATION,
  CLOSE_DURATION,
  WHEEL_PX_PER_SLIDE,
  SETTLE_IDLE_MS,
  DRAG_THRESHOLD_PX,
  BG_IMAGE_DARK,
  BG_IMAGE_LIGHT,
} from './hardback-data';
import { HardbackScene } from './HardbackScene';

type Mode = 'entering' | 'browsing' | 'opening' | 'open' | 'closing';

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

export default function Hardback({
  initialBooks,
}: {
  initialBooks?: BookData[];
} = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const topChromeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const buyPanelRef = useRef<HTMLElement>(null);
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  // ── Theme State with MutationObserver & Custom Event ─────────────────────
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    const doc = document.documentElement;
    return (
      doc.classList.contains('dark') ||
      doc.getAttribute('data-theme') === 'dark' ||
      doc.getAttribute('data-theme') !== 'light'
    );
  });

  useEffect(() => {
    const readFromDOM = () => {
      const doc = document.documentElement;
      const isDarkMode =
        doc.classList.contains('dark') ||
        doc.getAttribute('data-theme') === 'dark' ||
        (doc.getAttribute('data-theme') !== 'light' &&
          !doc.classList.contains('light'));
      setIsDark(isDarkMode);
    };

    readFromDOM();

    const onEvent = () => readFromDOM();
    window.addEventListener('theme-change', onEvent);

    const observer = new MutationObserver(readFromDOM);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    return () => {
      window.removeEventListener('theme-change', onEvent);
      observer.disconnect();
    };
  }, []);

  // ── Dynamic Books State from Database ────────────────────────────────────
  const [books, setBooks] = useState<BookData[]>(() => {
    if (initialBooks && initialBooks.length > 0) return initialBooks;
    return BOOKS;
  });

  useEffect(() => {
    if (initialBooks && initialBooks.length > 0) {
      setBooks(initialBooks);
      return;
    }

    let isMounted = true;
    fetch('/api/editors-shelf')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          setBooks(data.items);
        }
      })
      .catch((err) => console.error('Failed to load shelf books:', err));
    return () => {
      isMounted = false;
    };
  }, [initialBooks]);

  // ── Mobile Responsive State ──────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Animation Refs & State ───────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('entering');
  const modeRef = useRef<Mode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const initialCenterIndex = Math.floor(books.length / 2);

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const selectedIndexRef = useRef<number>(-1);

  const [activeIndex, setActiveIndex] = useState<number>(initialCenterIndex);
  const [hoverIndex, setHoverIndex] = useState<number>(-1);
  const hoverIndexRef = useRef<number>(-1);

  const positionRef = useRef<number>(initialCenterIndex);
  const targetRef = useRef<number>(initialCenterIndex);
  const velocityRef = useRef<number>(0);
  const enterProgressRef = useRef<number>(0);
  const openProgressRef = useRef<number>(0);

  const [showPanel, setShowPanel] = useState<boolean>(false);
  const panelRevealTweenRef = useRef<gsap.core.Tween | null>(null);

  // When books change, re-align initial center if not browsing yet
  useEffect(() => {
    const center = Math.floor(books.length / 2);
    if (mode === 'entering') {
      positionRef.current = center;
      targetRef.current = center;
      setActiveIndex(center);
    }
  }, [books.length, mode]);

  // ── Entrance Animation ───────────────────────────────────────────────────
  useEffect(() => {
    enterProgressRef.current = 0;
    const tween = gsap.to(enterProgressRef, {
      current: 1,
      duration: 2.0, // ENTRANCE_DURATION
      ease: 'none',
      onComplete: () => {
        setMode('browsing');
        modeRef.current = 'browsing';
      },
    });

    return () => {
      tween.kill();
    };
  }, []);

  // ── Active Book Derivation (Polling rAF for integer snap) ────────────────
  useEffect(() => {
    let last = Math.floor(books.length / 2);
    let raf = 0;
    const numBooks = books.length || 1;
    const maxIndex = Math.max(0, numBooks - 1);
    const tick = () => {
      const rounded = Math.round(positionRef.current);
      // Strictly clamp between 0 and maxIndex so edge books never wrap or bleed over
      const idx = Math.max(0, Math.min(maxIndex, rounded));
      if (idx !== last) {
        last = idx;
        setActiveIndex(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [books.length]);

  // ── Hero Title Cascade (700ms delayed GSAP 3D page flip) ─────────────────
  useEffect(() => {
    const letters = titleRef.current?.querySelectorAll('.title-letter');
    if (!letters || letters.length === 0) return;

    const tl = gsap.timeline({ delay: 0.7 });

    tl.fromTo(
      letters,
      {
        rotateX: -90,
        z: -45,
        y: 30,
        scaleY: 0.42,
        scaleX: 0.96,
        opacity: 0,
        transformOrigin: '50% 100%',
      },
      {
        rotateX: 0,
        z: 0,
        y: 0,
        scaleY: 1,
        scaleX: 1,
        opacity: 1,
        duration: 1.1,
        ease: 'back.out(1.15)',
        stagger: { each: 0.028, from: 'center' },
        force3D: true,
      }
    );

    // Settle pulse like ink soaking into paper
    tl.to(
      letters,
      {
        scale: 1.025,
        duration: 0.16,
        ease: 'sine.out',
        stagger: { each: 0.012, from: 'center' },
      },
      '-=0.55'
    );
    tl.to(
      letters,
      {
        scale: 1,
        duration: 0.32,
        ease: 'sine.inOut',
        stagger: { each: 0.012, from: 'center' },
      },
      '-=0.08'
    );

    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out' },
        '-=0.4'
      );
    }

    if (activeLineRef.current) {
      tl.fromTo(
        activeLineRef.current,
        { autoAlpha: 0, y: 10, scaleX: 0.9, transformOrigin: '50% 50%' },
        { autoAlpha: 1, y: 0, scaleX: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.45'
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  // ── Open Book Flow ───────────────────────────────────────────────────────
  const openBook = useCallback((index: number) => {
    if (modeRef.current !== 'browsing') return;

    const distance = Math.abs(index - positionRef.current);
    const isCentred = distance < 0.4;

    setMode('opening');
    modeRef.current = 'opening';
    targetRef.current = index;
    velocityRef.current = 0;

    gsap.killTweensOf(positionRef);
    gsap.killTweensOf(openProgressRef);
    openProgressRef.current = 0;

    // Smoothly fade out top header chrome with GSAP
    if (topChromeRef.current) {
      gsap.killTweensOf(topChromeRef.current);
      gsap.to(topChromeRef.current, {
        autoAlpha: 0,
        y: -24,
        duration: 0.65,
        ease: 'power2.inOut',
      });
    }

    const startOpening = () => {
      setSelectedIndex(index);
      selectedIndexRef.current = index;

      // Buy panel reveals at 72% of the open animation
      panelRevealTweenRef.current?.kill();
      panelRevealTweenRef.current = gsap.delayedCall(
        OPEN_DURATION * 0.72,
        () => {
          setShowPanel(true);
        }
      );

      gsap.to(openProgressRef, {
        current: 1,
        duration: OPEN_DURATION,
        ease: 'power2.inOut',
        onComplete: () => {
          setMode('open');
          modeRef.current = 'open';
        },
      });
    };

    if (isCentred) {
      positionRef.current = index; // snap sub-pixel drift
      startOpening();
    } else {
      // Side click: briskly center and immediately bloom open without lag
      const snapDur = Math.min(0.26, 0.12 + distance * 0.04);
      gsap.to(positionRef, {
        current: index,
        duration: snapDur,
        ease: 'power2.out',
        onComplete: startOpening,
      });
    }
  }, []);

  // ── Close Book Flow ──────────────────────────────────────────────────────
  const closeBook = useCallback(() => {
    const m = modeRef.current;
    if (m !== 'open' && m !== 'opening') return;

    setMode('closing');
    modeRef.current = 'closing';

    panelRevealTweenRef.current?.kill();
    panelRevealTweenRef.current = null;
    setShowPanel(false);

    // Smoothly fade top header chrome back in with GSAP
    if (topChromeRef.current) {
      gsap.killTweensOf(topChromeRef.current);
      gsap.to(topChromeRef.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        delay: CLOSE_DURATION * 0.35,
        ease: 'power2.out',
      });
    }

    gsap.killTweensOf(openProgressRef);
    gsap.to(openProgressRef, {
      current: 0,
      duration: CLOSE_DURATION,
      ease: 'power2.inOut',
      onComplete: () => {
        setSelectedIndex(-1);
        selectedIndexRef.current = -1;
        setMode('browsing');
        modeRef.current = 'browsing';
      },
    });
  }, []);

  // ── Book Click Handler ───────────────────────────────────────────────────
  const handleBookClick = useCallback(
    (index: number) => {
      const m = modeRef.current;
      if (m === 'browsing') openBook(index);
      else if (m === 'open') closeBook();
    },
    [openBook, closeBook]
  );

  const handleBookHover = useCallback((index: number) => {
    setHoverIndex(index);
    hoverIndexRef.current = index;
  }, []);

  const handleBookOut = useCallback(() => {
    setHoverIndex(-1);
    hoverIndexRef.current = -1;
  }, []);

  // ── Buy Panel Stagger Reveal & Hide Effect ────────────────────────────────
  useEffect(() => {
    const panel = buyPanelRef.current;
    if (!panel) return;

    if (showPanel) {
      gsap.killTweensOf(panel);
      gsap.killTweensOf(panel.children);

      gsap.fromTo(
        panel,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.65, ease: 'power2.out' }
      );

      const content = panel.querySelector('.buy-panel-content');
      if (content && content.children) {
        gsap.fromTo(
          content.children,
          { autoAlpha: 0, x: -24, filter: 'blur(6px)' },
          {
            autoAlpha: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: 0.75,
            ease: 'power3.out',
            stagger: { each: 0.05, from: 'start' },
          }
        );
      }
    } else {
      gsap.killTweensOf(panel);
      gsap.killTweensOf(panel.children);
      gsap.to(panel, { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' });

      const content = panel.querySelector('.buy-panel-content');
      if (content && content.children) {
        gsap.to(content.children, {
          x: -16,
          autoAlpha: 0,
          filter: 'blur(4px)',
          duration: 0.4,
          ease: 'power2.inOut',
          stagger: { each: 0.02, from: 'end' },
        });
      }
    }
  }, [showPanel]);

  // ── Wheel, Pointer Drag & Keyboard Listeners ──────────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let dragState = {
      active: false,
      startX: 0,
      lastX: 0,
      startPosition: 0,
      pointerId: 0,
      moved: false,
    };
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    // Wheel — always preventDefault, only navigate books
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (modeRef.current !== 'browsing') return;

      const numBooks = books.length || 1;
      const maxIndex = Math.max(0, numBooks - 1);

      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const slideDelta = delta / WHEEL_PX_PER_SLIDE;
      targetRef.current = clamp(
        targetRef.current + slideDelta,
        0,
        maxIndex
      );

      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const snapped = Math.round(targetRef.current);
        targetRef.current = clamp(snapped, 0, maxIndex);
      }, SETTLE_IDLE_MS);
    };

    // Pointer down: only prepare, do NOT capture pointer yet!
    const onPointerDown = (e: PointerEvent) => {
      if (modeRef.current !== 'browsing') return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if ((e.target as HTMLElement)?.closest('[data-no-drag]')) return;

      dragState = {
        active: true,
        startX: e.clientX,
        lastX: e.clientX,
        startPosition: positionRef.current,
        pointerId: e.pointerId,
        moved: false,
      };
    };

    // Pointer move: capture only after 4px threshold
    const onPointerMove = (e: PointerEvent) => {
      if (!dragState.active) return;
      const dx = e.clientX - dragState.startX;
      if (Math.abs(dx) > 4 && !dragState.moved) {
        dragState.moved = true;
        try {
          section.setPointerCapture(e.pointerId);
        } catch {}
      }
      if (!dragState.moved) return;

      const numBooks = books.length || 1;
      const maxIndex = Math.max(0, numBooks - 1);
      const slideDelta = -dx / (DRAG_THRESHOLD_PX * 1.4);
      const next = clamp(
        dragState.startPosition + slideDelta,
        0,
        maxIndex
      );
      positionRef.current = next;
      targetRef.current = next;
    };

    // Pointer up: snap immediately if dragged, else let click pass through
    const onPointerUp = (e: PointerEvent) => {
      if (!dragState.active) return;
      const moved = dragState.moved;
      dragState.active = false;
      if (moved) {
        try {
          section.releasePointerCapture(e.pointerId);
        } catch {}
        const numBooks = books.length || 1;
        const maxIndex = Math.max(0, numBooks - 1);
        const snapped = Math.round(targetRef.current);
        targetRef.current = clamp(snapped, 0, maxIndex);
      }
    };

    // Keyboard
    const onKey = (e: KeyboardEvent) => {
      if (modeRef.current === 'open' && e.key === 'Escape') {
        e.preventDefault();
        closeBook();
        return;
      }
      if (modeRef.current !== 'browsing') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        targetRef.current = Math.max(
          0,
          Math.round(positionRef.current) - 1
        );
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        targetRef.current = Math.min(
          books.length - 1,
          Math.round(positionRef.current) + 1
        );
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBook(
          Math.max(
            0,
            Math.min(books.length - 1, Math.round(positionRef.current))
          )
        );
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    section.addEventListener('pointerdown', onPointerDown);
    section.addEventListener('pointermove', onPointerMove);
    section.addEventListener('pointerup', onPointerUp);
    section.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('keydown', onKey);

    return () => {
      if (settleTimer) clearTimeout(settleTimer);
      window.removeEventListener('wheel', onWheel);
      section.removeEventListener('pointerdown', onPointerDown);
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerup', onPointerUp);
      section.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [closeBook, openBook, books.length]);

  // ── Flip Title Helper ────────────────────────────────────────────────────
  const renderFlipTitle = (
    text: string,
    opts: { italic: boolean; baseKey: string }
  ) => {
    return Array.from(text).map((char, i) => (
      <span
        key={`${opts.baseKey}-${i}`}
        className="title-letter inline-block"
        style={{
          transformOrigin: '50% 100%',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          willChange: 'transform, opacity',
          fontStyle: opts.italic ? 'italic' : 'normal',
          fontWeight: opts.italic ? 400 : 500,
          whiteSpace: 'pre',
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  const activeBook: BookData = useMemo(() => {
    const maxIdx = Math.max(0, books.length - 1);
    const clampedIdx = Math.max(0, Math.min(maxIdx, activeIndex));
    return books[clampedIdx] || books[0] || BOOKS[0];
  }, [books, activeIndex]);

  const selectedBook: BookData = useMemo(() => {
    return books[selectedIndex] || activeBook;
  }, [books, selectedIndex, activeBook]);

  return (
    <section
      ref={sectionRef}
      aria-label="Hardback 3D Interactive Bookshelf Section"
      className="relative isolate w-full h-screen overflow-hidden select-none"
      style={{
        backgroundColor: isDark ? '#1a130a' : '#f5efe2',
        color: isDark ? '#f3ecd8' : '#1a1310',
        cursor: hoverIndex >= 0 && mode === 'browsing' ? 'pointer' : 'default',
      }}
    >
      {/* 1. Dark Theme Reading Room Photograph */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${BG_IMAGE_DARK})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          opacity: isDark ? 1 : 0,
          filter: mode === 'open' || mode === 'opening' ? 'blur(10px)' : 'blur(0px)',
          transform: mode === 'open' || mode === 'opening' ? 'scale(1.04)' : 'scale(1)',
          transition: 'opacity 600ms ease, filter 700ms ease, transform 700ms ease',
        }}
      />

      {/* 2. Light Theme Reading Room Photograph */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${BG_IMAGE_LIGHT})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          opacity: isDark ? 0 : 1,
          filter: mode === 'open' || mode === 'opening' ? 'blur(10px)' : 'blur(0px)',
          transform: mode === 'open' || mode === 'opening' ? 'scale(1.04)' : 'scale(1)',
          transition: 'opacity 600ms ease, filter 700ms ease, transform 700ms ease',
        }}
      />

      {/* 3. Subtle Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 130% 130% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.32) 100%)',
        }}
      />

      {/* 4. WebGL R3F Canvas */}
      <div className="absolute inset-0 z-10">
        <HardbackScene
          books={books}
          isDark={isDark}
          isMobile={isMobile}
          positionRef={positionRef}
          targetRef={targetRef}
          modeRef={modeRef}
          selectedIndexRef={selectedIndexRef}
          openProgressRef={openProgressRef}
          enterProgressRef={enterProgressRef}
          hoverIndexRef={hoverIndexRef}
          onBookClick={handleBookClick}
          onBookHover={handleBookHover}
          onBookOut={handleBookOut}
        />
      </div>

      {/* 5. Top HTML Chrome: Title, Subtitle & Active Line */}
      <div
        ref={topChromeRef}
        className="absolute inset-x-0 top-0 z-20 pointer-events-none flex flex-col items-center justify-start pt-[8vh] md:pt-[10vh] px-6 text-center"
      >
        <div
          ref={titleRef}
          className="text-[clamp(38px,5.6vw,92px)] leading-[0.92] tracking-[-0.04em] font-medium"
          style={{
            fontFamily: 'var(--font-playfair), serif',
            color: isDark ? '#f3ecd8' : '#1a1310',
            perspective: '1200px',
            perspectiveOrigin: '50% 90%',
            transformStyle: 'preserve-3d',
          }}
        >
          {renderFlipTitle('The Excelsior Shelf', { italic: false, baseKey: 'ti-shelf' })}
        </div>

        <div
          ref={subtitleRef}
          className="mt-3 text-center whitespace-nowrap tracking-[0.025em] italic font-normal"
          style={{
            color: isDark
              ? 'rgba(245, 239, 226, 0.72)'
              : 'rgba(26, 19, 16, 0.75)',
            fontFamily: 'var(--font-lora), Georgia, serif',
            fontSize: 'clamp(13px, 1.15vw, 16px)',
          }}
        >
          {books.length} {books.length === 1 ? 'essential read' : 'essential reads'} — from midnight essays to timeless volumes.
        </div>

        <div
          ref={activeLineRef}
          className="mt-6 flex flex-col md:flex-row items-center gap-2 md:gap-3 text-[13px] md:text-[14px] font-medium"
          style={{
            color: isDark ? '#d4a25a' : '#9a5e2c',
            fontFamily:
              'var(--font-martel), var(--font-noto-devanagari), var(--font-lora), Georgia, serif',
            letterSpacing: '0.03em',
          }}
        >
          <span className="hidden md:block h-px w-10 bg-current opacity-40" />
          <span className="font-semibold tracking-[0.02em]">{activeBook.title}</span>
          <span className="hidden md:inline opacity-50">·</span>
          <span className="text-[12px] md:text-[13px] opacity-85 tracking-[0.02em]">
            {activeBook.author}
          </span>
          <span className="hidden md:block h-px w-10 bg-current opacity-40" />
        </div>
      </div>

      {/* 6. Buy Details Overlay Panel */}
      <aside
        ref={buyPanelRef}
        aria-label={`${selectedBook.title} — details`}
        className="absolute pointer-events-auto opacity-0 z-30
          md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:left-[calc(50%+3.5vw)]
          md:w-[min(440px,38vw)] md:max-h-[78vh] md:bottom-auto
          top-[44vh] bottom-[3vh] left-1/2 -translate-x-1/2 w-[92vw] max-w-[520px]
          overflow-y-auto"
        style={{
          visibility: 'hidden',
          color: isDark ? '#f3ecd8' : '#1a1310',
        }}
        data-no-drag
      >
        <div className="buy-panel-content px-2 py-2 md:px-1 md:py-2">
          {/* Top row: Eyebrow + Close icon */}
          <div className="flex items-center justify-between gap-4">
            <div
              className="text-[10.5px] md:text-[11px] tracking-[0.24em] uppercase font-medium"
              style={{
                color: isDark ? 'rgba(243, 236, 216, 0.75)' : 'rgba(26, 19, 16, 0.65)',
              }}
            >
              {selectedBook.categoryBadge || (selectedBook.language === 'hi' ? 'साप्ताहिक कृति · फरवरी २०२५' : 'Read of the Week · Feb 2025')}
            </div>
            <motion.button
              onClick={closeBook}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              className="flex items-center justify-center w-9 h-9 rounded-full
                         border border-neutral-300 dark:border-white/30
                         bg-neutral-100/90 dark:bg-white/10 backdrop-blur-sm
                         text-foreground dark:text-[#f3ecd8]
                         hover:bg-foreground hover:text-background dark:hover:bg-white dark:hover:text-black dark:hover:border-white hover:border-foreground
                         transition-colors duration-200 cursor-pointer"
              aria-label="Close book"
            >
              <X size={17} strokeWidth={2} />
            </motion.button>
          </div>

          {/* Title with fluid responsive clamp */}
          <h2
            className="mt-2.5 md:mt-3.5 text-[clamp(25px,7vw,42px)] leading-[1.12] tracking-[-0.025em] font-medium text-foreground w-full line-clamp-2 md:line-clamp-none"
            style={{
              fontFamily:
                'var(--font-playfair), var(--font-rozha), var(--font-martel), Georgia, serif',
            }}
          >
            {selectedBook.title}
          </h2>

          {/* Author */}
          <div
            className="mt-1.5 md:mt-2 text-[clamp(14px,3.8vw,16px)] tracking-[0.02em]"
            style={{
              color: isDark ? 'rgba(243, 236, 216, 0.95)' : 'rgba(26, 19, 16, 0.9)',
              fontFamily:
                'var(--font-lora), var(--font-martel), Georgia, serif',
            }}
          >
            <span className="italic opacity-70 font-normal">by</span>{' '}
            <span className="font-medium">{selectedBook.author}</span>
          </div>

          {/* Synopsis filling available space with fluid sizing */}
          <p
            className="mt-4 md:mt-5 w-full leading-[1.7] line-clamp-4 md:line-clamp-none text-[clamp(14px,3.8vw,16.5px)]"
            style={{
              color: isDark ? 'rgba(243, 236, 216, 0.90)' : 'rgba(26, 19, 16, 0.88)',
              fontFamily:
                'var(--font-lora), var(--font-martel), Georgia, serif',
            }}
          >
            {selectedBook.synopsis}
          </p>

          {/* Excerpt blockquote filling available space */}
          <blockquote
            className="mt-4 md:mt-5 w-full pl-3.5 md:pl-4 border-l-2 border-amber-500/50 dark:border-amber-300/40 italic leading-[1.65] line-clamp-3 md:line-clamp-none text-[clamp(13px,3.5vw,15.5px)]"
            style={{
              color: isDark ? 'rgba(243, 236, 216, 0.88)' : 'rgba(26, 19, 16, 0.82)',
              fontFamily:
                'var(--font-lora), var(--font-martel), Georgia, serif',
            }}
          >
            "{selectedBook.excerpt}"
          </blockquote>

          {/* Primary Read Now CTA button with Signature Micro-Animation from Gallery Section */}
          <a
            href={selectedBook.readLink || selectedBook.retailers?.[0]?.url || '/publications'}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setIsCtaHovered(true)}
            onMouseLeave={() => setIsCtaHovered(false)}
            className="group mt-6 md:mt-8 pb-3 md:pb-0 inline-flex items-center gap-4 text-left cursor-pointer select-none"
            aria-label={`Read ${selectedBook.title}`}
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] font-medium">
              <motion.span
                animate={{
                  color: isCtaHovered
                    ? isDark
                      ? '#ffffff'
                      : '#1a1310'
                    : isDark
                    ? 'rgba(243, 236, 216, 0.75)'
                    : 'rgba(26, 19, 16, 0.65)',
                  x: isCtaHovered ? 4 : 0,
                }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                className="inline-block"
              >
                {selectedBook.readButtonText || 'Read publication'}
              </motion.span>
            </div>

            {/* Interactive Circle with Smooth Elastic Spring and Rotate from Gallery Section */}
            <motion.span
              animate={{
                scale: isCtaHovered ? 1.14 : 1.0,
                backgroundColor: isCtaHovered
                  ? isDark
                    ? '#ffffff'
                    : '#1a1310'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(26, 19, 16, 0.06)',
                color: isCtaHovered
                  ? isDark
                    ? '#000000'
                    : '#ffffff'
                  : isDark
                  ? '#ffffff'
                  : '#1a1310',
                borderColor: isCtaHovered
                  ? isDark
                    ? '#ffffff'
                    : '#1a1310'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.32)'
                  : 'rgba(26, 19, 16, 0.25)',
              }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm"
            >
              <motion.div
                animate={{
                  rotate: isCtaHovered ? 45 : 0,
                  scale: isCtaHovered ? 1.12 : 1.0,
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="flex items-center justify-center pointer-events-none"
              >
                <ArrowUpRight size={17} strokeWidth={1.8} />
              </motion.div>
            </motion.span>
          </a>
        </div>
      </aside>
    </section>
  );
}
