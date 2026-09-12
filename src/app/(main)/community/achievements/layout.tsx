// src/app/(main)/community/achievements/layout.tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Accolades & Achievements | Excelsior - IET Lucknow',
  description:
    'Celebrating the accolades, debating victories, writing awards, and milestones achieved by Excelsior members across national inter-college festivals.',
  keywords: [
    'Excelsior Achievements',
    'IET Lucknow Debating Awards',
    'Literary Competition Winners',
    'Excelsior Accolades',
  ],
  alternates: {
    canonical: `${SITE_URL}/community/achievements`,
  },
  openGraph: {
    title: 'Accolades & Achievements | Excelsior - IET Lucknow',
    description:
      'Accolades, debating victories, and writing awards achieved by Excelsior members at IET Lucknow.',
    url: `${SITE_URL}/community/achievements`,
  },
};

export default function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
