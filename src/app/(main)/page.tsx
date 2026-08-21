// src/app/(main)/page.tsx
'use client';

import { useState } from 'react';
import HomePreloader from '@/components/home/HomePreloader';
import CardwallHero from '@/components/home/CardwallHero';
import ManifestoStrip from '@/components/home/ManifestoStrip';
import EventsIndex from '@/components/home/EventsIndex';
import LibraryShelf from '@/components/home/LibraryShelf';
import AlumniVoices from '@/components/home/AlumniVoices';
import GalleryStrip from '@/components/home/GalleryStrip';
import type { HeroCardInput } from '@/components/sections/cardwall/Cardwall';

export default function RootPage() {
  const [isReady, setIsReady] = useState(false);
  const [heroCards, setHeroCards] = useState<HeroCardInput[]>([]);

  return (
    <>
      <HomePreloader
        onPrepared={(cards) => setHeroCards(cards)}
        onComplete={() => setIsReady(true)}
      />

      <div className="w-full font-sans overflow-x-clip">
        {/* ── 01 · CARDWALL WAVE 3D HERO (Starts at Frame 1, triggers upon loader exit) ── */}
        <CardwallHero
          startEntrance={isReady}
          heroCards={heroCards}
        />

        {/* ── SUBSEQUENT PAGE SECTIONS (Opaque Z-300 backdrop cleanly isolating 3D ribbon tail) ── */}
        <div className="relative z-[300] bg-background">
          {/* ── 02 · MANIFESTO / SENIOR LEGACY ── */}
          <ManifestoStrip />

          {/* ── 03 · EVENTS WE HOSTED ── */}
          <EventsIndex />

          {/* ── 04 · THE SOCIETY LIBRARY (PINNED HORIZONTAL SHELF) ── */}
          <LibraryShelf />

          {/* ── 05 · ALUMNI VOICES ── */}
          <AlumniVoices />

          {/* ── 06 · GALLERY FRAGMENTS ── */}
          <GalleryStrip />
        </div>
      </div>
    </>
  );
}


