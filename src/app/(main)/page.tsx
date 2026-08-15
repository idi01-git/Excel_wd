// src/app/(main)/page.tsx
'use client';

import CardwallHero from '@/components/home/CardwallHero';
import ManifestoStrip from '@/components/home/ManifestoStrip';
import EventsIndex from '@/components/home/EventsIndex';
import LibraryShelf from '@/components/home/LibraryShelf';
import AlumniVoices from '@/components/home/AlumniVoices';
import GalleryStrip from '@/components/home/GalleryStrip';

export default function RootPage() {
  return (
    <div className="w-full font-sans">
      {/* ── 01 · CARDWALL WAVE 3D HERO ── */}
      <CardwallHero />

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
  );
}
