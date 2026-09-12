// src/app/(main)/editors-shelf/layout.tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: "The Editor's Shelf | Excelsior - IET Lucknow",
  description:
    'Handpicked book recommendations, literary reviews, and editorial commentaries curated by the editorial board of Excelsior, IET Lucknow.',
  keywords: [
    "Editor's Shelf",
    'Excelsior Book Reviews',
    'IET Lucknow Book Recommendations',
    'Literature Reviews',
    'Excelsior IET Lucknow',
  ],
  alternates: {
    canonical: `${SITE_URL}/editors-shelf`,
  },
  openGraph: {
    title: "The Editor's Shelf | Excelsior - IET Lucknow",
    description:
      'Handpicked book recommendations, literary reviews, and editorial commentaries curated by Excelsior, IET Lucknow.',
    url: `${SITE_URL}/editors-shelf`,
  },
};

export default function EditorsShelfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
