// src/app/(main)/community/members/layout.tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Society Members & Coordinators | Excelsior - IET Lucknow',
  description:
    'Meet the editorial board, coordinators, core team, and active members of Excelsior, the Literary Club of the Institute of Engineering and Technology (IET), Lucknow.',
  keywords: [
    'Excelsior Members',
    'Excelsior Coordinators',
    'IET Lucknow Literary Club Members',
    'Excelsior Team',
    'IET Lucknow Club Coordinators',
  ],
  alternates: {
    canonical: `${SITE_URL}/community/members`,
  },
  openGraph: {
    title: 'Society Members & Coordinators | Excelsior - IET Lucknow',
    description:
      'Meet the student leaders, editors, and writers driving Excelsior at IET Lucknow.',
    url: `${SITE_URL}/community/members`,
  },
};

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
