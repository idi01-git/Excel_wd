// src/app/(main)/community/alumni/layout.tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Alumni Network & Voices | Excelsior - IET Lucknow',
  description:
    'Explore the legacy and testaments of Excelsior alumni from the Institute of Engineering and Technology (IET), Lucknow, now making their mark worldwide.',
  keywords: [
    'Excelsior Alumni',
    'IET Lucknow Literary Alumni',
    'Excelsior Heritage',
    'IET Lucknow Club Alumni',
  ],
  alternates: {
    canonical: `${SITE_URL}/community/alumni`,
  },
  openGraph: {
    title: 'Alumni Network & Voices | Excelsior - IET Lucknow',
    description:
      'The legacy and testaments of Excelsior alumni from IET Lucknow.',
    url: `${SITE_URL}/community/alumni`,
  },
};

export default function AlumniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
