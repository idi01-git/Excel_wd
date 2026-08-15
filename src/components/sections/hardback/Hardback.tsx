'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import gsap from 'gsap';
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

export default function Hardback() {
  const sectionRef = useRef<HTMLElement>(null);
  const topChromeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const buyPanelRef = useRef<HTMLElement>(null);

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

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const selectedIndexRef = useRef<number>(-1);

  const [activeIndex, setActiveIndex] = useState<number>(INITIAL_INDEX);
  const [hoverIndex, setHoverIndex] = useState<number>(-1);
  const hoverIndexRef = useRef<number>(-1);

  const positionRef = useRef<number>(INITIAL_INDEX);
  const targetRef = useRef<number>(INITIAL_INDEX);
  const velocityRef = useRef<number>(0);
  const enterProgressRef = useRef<number>(0);
  const openProgressRef = useRef<number>(0);

  const [showPanel, setShowPanel] = useState<boolean>(false);
  const panelRevealTweenRef = useRef<gsap.core.Tween | null>(null);

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
    let last = INITIAL_INDEX;
    let raf = 0;
    const tick = () => {
      const rounded = Math.round(positionRef.current);
      const idx = ((rounded % BOOKS.length) + BOOKS.length) % BOOKS.length;
      if (idx !== last) {
        last = idx;
        setActiveIndex(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
      // Side click: smoothly slide to centre first, then open
      const snapDur = clamp(0.22 + distance * 0.08, 0.32, 0.7);
      gsap.to(positionRef, {
        current: index,
        duration: snapDur,
        ease: 'power3.out',
        onComplete: () => {
          gsap.delayedCall(0.12, startOpening);
        },
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
        ease: 'power3.out',
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

      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const slideDelta = delta / WHEEL_PX_PER_SLIDE;
      targetRef.current = clamp(
        targetRef.current + slideDelta,
        0,
        BOOKS.length - 1
      );

      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const snapped = Math.round(targetRef.current);
        targetRef.current = clamp(snapped, 0, BOOKS.length - 1);
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

      const slideDelta = -dx / (DRAG_THRESHOLD_PX * 1.4);
      const next = clamp(
        dragState.startPosition + slideDelta,
        0,
        BOOKS.length - 1
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
        const snapped = Math.round(targetRef.current);
        targetRef.current = clamp(snapped, 0, BOOKS.length - 1);
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
          BOOKS.length - 1,
          Math.round(positionRef.current) + 1
        );
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBook(
          Math.max(
            0,
            Math.min(BOOKS.length - 1, Math.round(positionRef.current))
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
  }, [closeBook, openBook]);

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
    return BOOKS[activeIndex] || BOOKS[0];
  }, [activeIndex]);

  const selectedBook: BookData = useMemo(() => {
    return BOOKS[selectedIndex] || activeBook;
  }, [selectedIndex, activeBook]);

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
          transition: 'opacity 600ms ease',
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
          transition: 'opacity 600ms ease',
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
          className="text-[clamp(42px,6.2vw,100px)] leading-[0.96] tracking-[-0.02em] font-medium"
          style={{
            fontFamily:
              'var(--font-hardback-serif, "Cormorant Garamond"), Georgia, serif',
            color: isDark ? '#f3ecd8' : '#1a1310',
            perspective: '1400px',
            perspectiveOrigin: '50% 90%',
            transformStyle: 'preserve-3d',
          }}
        >
          {renderFlipTitle('The ', { italic: true, baseKey: 'ti-1' })}
          {renderFlipTitle('Reading', { italic: false, baseKey: 'ti-2' })}
          {renderFlipTitle(' Hour', { italic: true, baseKey: 'ti-3' })}
        </div>

        <div
          ref={subtitleRef}
          className="mt-4 max-w-[44rem] leading-[1.6] italic"
          style={{
            color: isDark
              ? 'rgba(245, 239, 226, 0.55)'
              : 'rgba(26, 19, 16, 0.58)',
            fontFamily:
              'var(--font-hardback-serif, "Cormorant Garamond"), Georgia, serif',
            fontSize: 'clamp(14px, 1.15vw, 18px)',
            fontWeight: 400,
          }}
        >
          {BOOKS.length} Excelsior’s picks on building, growing, and lasting — pulled from the shelf, the lamp's on.
        </div>

        <div
          ref={activeLineRef}
          className="mt-6 flex flex-col md:flex-row items-center gap-1.5 md:gap-3 text-[11.5px] tracking-[0.24em] uppercase font-medium"
          style={{ color: isDark ? '#d4a25a' : '#9a5e2c' }}
        >
          <span className="hidden md:block h-px w-10 bg-current opacity-50" />
          <span>{activeBook.title}</span>
          <span className="hidden md:inline opacity-55">·</span>
          <span className="text-[10.5px] md:text-[11.5px] opacity-75 md:opacity-100">
            {activeBook.author}
          </span>
          <span className="hidden md:block h-px w-10 bg-current opacity-50" />
        </div>
      </div>

      {/* 6. Buy Details Overlay Panel */}
      <aside
        ref={buyPanelRef}
        aria-label={`${selectedBook.title} — details`}
        className="absolute pointer-events-auto opacity-0 z-30
          md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:left-[calc(50%+3.5vw)]
          md:w-[min(420px,37vw)] md:max-h-[78vh] md:bottom-auto
          top-[48vh] bottom-[3vh] left-1/2 -translate-x-1/2 w-[88vw] max-w-[480px]
          overflow-y-auto"
        style={{
          visibility: 'hidden',
          color: isDark ? '#f3ecd8' : '#1a1310',
        }}
        data-no-drag
      >
        <div className="buy-panel-content px-2 py-3 md:px-1 md:py-2">
          {/* Top row: Eyebrow + Close pill */}
          <div className="flex items-start justify-between gap-4">
            <div className="text-[10px] tracking-[0.24em] uppercase opacity-55 pt-1">
              Hardback · {selectedBook.author.split(' ').pop()}
            </div>
            <button
              onClick={closeBook}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                         border border-current/30 hover:border-current/65
                         text-[10.5px] tracking-[0.22em] uppercase font-medium
                         opacity-75 hover:opacity-100 transition-all cursor-pointer"
              style={{ color: isDark ? '#f3ecd8' : '#1a1310' }}
              aria-label="Close book"
            >
              <span>Close</span>
              <span aria-hidden className="text-[15px] leading-none -mr-0.5">
                ×
              </span>
            </button>
          </div>

          {/* Title */}
          <h2
            className="mt-3 text-[clamp(26px,2.3vw,40px)] leading-[1.05] tracking-[-0.012em] font-medium"
            style={{
              fontFamily:
                'var(--font-hardback-serif, "Cormorant Garamond"), Georgia, serif',
            }}
          >
            {selectedBook.title}
          </h2>

          {/* Author */}
          <div className="mt-1.5 text-[13px] tracking-[0.06em] opacity-70">
            by {selectedBook.author}
          </div>

          {/* Synopsis */}
          <p
            className="mt-5 max-w-[36ch] opacity-80"
            style={{
              fontFamily:
                'var(--font-hardback-serif, "Cormorant Garamond"), Georgia, serif',
              fontSize: 'clamp(14.5px, 1.02vw, 16.5px)',
              lineHeight: 1.55,
            }}
          >
            {selectedBook.synopsis}
          </p>

          {/* Excerpt blockquote */}
          <blockquote
            className="mt-5 pl-4 border-l border-current/25 italic opacity-75"
            style={{
              fontFamily:
                'var(--font-hardback-serif, "Cormorant Garamond"), Georgia, serif',
              fontSize: 'clamp(13px, 0.92vw, 15px)',
              lineHeight: 1.5,
            }}
          >
            "{selectedBook.excerpt}"
          </blockquote>

          {/* Retailer Links if available */}
          {selectedBook.retailers && selectedBook.retailers.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedBook.retailers.map((r, idx) => (
                <a
                  key={idx}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] border border-current/20 hover:border-current/50 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <span>{r.name}</span>
                  <span className="opacity-50">·</span>
                  <span className="font-medium">{r.price}</span>
                </a>
              ))}
            </div>
          )}

          {/* Primary Buy CTA button */}
          <a
            href={
              selectedBook.retailers?.[0]?.url || '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-6 flex w-fit items-center justify-center gap-3
                       rounded-full px-7 py-3.5
                       text-[12px] tracking-[0.2em] uppercase font-medium cursor-pointer
                       hover:gap-4
                       [transition:gap_220ms_ease,opacity_220ms_ease,box-shadow_220ms_ease]"
            style={{
              backgroundColor: isDark ? '#f3ecd8' : '#1a1310',
              color: isDark ? '#1a130a' : '#f5efe2',
            }}
            aria-label={`Buy ${selectedBook.title}`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M2.5 4.5h11l-1 9.5H3.5l-1-9.5z" />
              <path d="M5.5 4.5V3.2a2.5 2.5 0 015 0V4.5" />
            </svg>
            <span>Buy this book</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            >
              <path d="M2 7h10M8 3l4 4-4 4" />
            </svg>
          </a>

          <div className="mt-4 text-[10px] tracking-[0.24em] uppercase opacity-45 hidden md:block">
            press esc to close
          </div>
        </div>
      </aside>
    </section>
  );
}
