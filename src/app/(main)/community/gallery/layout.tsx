// src/app/(main)/community/gallery/layout.tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Photo Gallery & Moments | Excelsior - IET Lucknow',
  description:
    'Moments captured through the lens: open mics, annual literary festivals, club sessions, and stage performances by Excelsior at IET Lucknow.',
  keywords: [
    'Excelsior Gallery',
    'IET Lucknow Club Photos',
    'Excelsior Events Gallery',
    'College Festival Moments',
  ],
  alternates: {
    canonical: `${SITE_URL}/community/gallery`,
  },
  openGraph: {
    title: 'Photo Gallery & Moments | Excelsior - IET Lucknow',
    description:
      'Moments captured through the lens: open mics, annual literary festivals, and club sessions by Excelsior at IET Lucknow.',
    url: `${SITE_URL}/community/gallery`,
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
