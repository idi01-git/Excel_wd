// src/app/(main)/events/layout.tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Literary Events & Competitions | Excelsior - IET Lucknow',
  description:
    'Explore upcoming and past literary festivals, debating tournaments, poetry slams, and creative competitions organized by Excelsior at the Institute of Engineering and Technology (IET), Lucknow.',
  keywords: [
    'IET Lucknow Events',
    'Excelsior Events',
    'Literary Events Lucknow',
    'College Debate Lucknow',
    'Poetry Slam IET Lucknow',
    'IET Lucknow Competitions',
  ],
  alternates: {
    canonical: `${SITE_URL}/events`,
  },
  openGraph: {
    title: 'Literary Events & Competitions | Excelsior - IET Lucknow',
    description:
      'Explore debating tournaments, poetry slams, and creative competitions organized by Excelsior at IET Lucknow.',
    url: `${SITE_URL}/events`,
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
