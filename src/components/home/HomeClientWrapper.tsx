'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useLenis } from 'lenis/react';
import HomePreloader from '@/components/home/HomePreloader';
import CardwallHero from '@/components/home/CardwallHero';
import ManifestoStrip from '@/components/home/ManifestoStrip';
import EventsIndex from '@/components/home/EventsIndex';
import LibraryShelf from '@/components/home/LibraryShelf';
import AlumniVoices from '@/components/home/AlumniVoices';
import GalleryStrip from '@/components/home/GalleryStrip';
import type { HeroCardInput } from '@/components/sections/cardwall/Cardwall';
import type { BookData } from '@/components/sections/hardback/hardback-data';

export default function HomeClientWrapper({
  initialHeroCards = [],
  initialEvents,
  initialTestimonials,
  initialShelfBooks,
  initialLibraryCount,
}: {
  initialHeroCards?: HeroCardInput[];
  initialEvents?: any[];
  initialTestimonials?: any[];
  initialShelfBooks?: BookData[];
  initialLibraryCount?: number;
}) {
  const [isReady, setIsReady] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    const warmShelf = async () => {
      const [, { preloadBookAssets }, { BOOKS }] = await Promise.all([
        import('@/components/home/Book3DCard'),
        import('@/components/sections/hardback/hardback-textures'),
        import('@/components/sections/hardback/hardback-data'),
      ]);

      if (!cancelled) {
        void preloadBookAssets((initialShelfBooks?.length ? initialShelfBooks : BOOKS).slice(0, 5));
      }
    };

    void warmShelf().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialShelfBooks, isReady]);
  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      lenis?.scrollTo(0, { immediate: true, force: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [lenis]);

  return (
    <>
      <HomePreloader
        heroCards={initialHeroCards}
        onComplete={() => setIsReady(true)}
      />

      <div className="w-full font-sans overflow-x-clip">
        {/* ── 01 · CARDWALL WAVE 3D HERO (Starts at Frame 1, triggers upon loader exit) ── */}
        <CardwallHero
          startEntrance={isReady}
          heroCards={initialHeroCards}
        />

        {/* ── SUBSEQUENT PAGE SECTIONS (Opaque Z-300 backdrop cleanly isolating 3D ribbon tail) ── */}
        <div className="relative z-300 bg-background">
          {/* ── 02 · MANIFESTO / SENIOR LEGACY ── */}
          <ManifestoStrip />

          {/* ── 03 · EVENTS WE HOSTED ── */}
          <div className="section-deferred">
            <EventsIndex initialEvents={initialEvents} />
          </div>

          {/* ── 04 · THE SOCIETY LIBRARY (PINNED HORIZONTAL SHELF) ── */}
          <LibraryShelf
            initialBooks={initialShelfBooks}
            initialLibraryCount={initialLibraryCount}
          />

          {/* ── 05 · ALUMNI VOICES ── */}
          <div className="section-deferred">
            <AlumniVoices initialVoices={initialTestimonials} />
          </div>

          {/* ── 06 · GALLERY FRAGMENTS ── */}
          <div className="section-deferred">
            <GalleryStrip />
          </div>
        </div>
      </div>
    </>
  );
}
