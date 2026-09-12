// src/app/(main)/community/library/layout.tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Society Lending Library | Excelsior - IET Lucknow',
  description:
    'Browse the physical and digital book collection of the Excelsior Literary Society at the Institute of Engineering and Technology (IET), Lucknow.',
  keywords: [
    'Excelsior Library',
    'IET Lucknow Society Library',
    'Literary Club Book Catalog',
    'Excelsior Book Collection',
  ],
  alternates: {
    canonical: `${SITE_URL}/community/library`,
  },
  openGraph: {
    title: 'Society Lending Library | Excelsior - IET Lucknow',
    description:
      'Browse the book collection of the Excelsior Literary Society at IET Lucknow.',
    url: `${SITE_URL}/community/library`,
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
