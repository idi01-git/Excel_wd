// src/app/(main)/publications/layout.tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Publications, Poetry & Articles | Excelsior - IET Lucknow',
  description:
    'Discover thought-provoking articles, essays, original poetry, and prose written by the literary minds of the Institute of Engineering and Technology (IET), Lucknow.',
  keywords: [
    'IET Lucknow Publications',
    'Excelsior Articles',
    'IET Lucknow Poetry',
    'Student Writing Lucknow',
    'Campus Journalism IET Lucknow',
    'College Literary Magazine',
    'Excelsior Publications',
  ],
  alternates: {
    canonical: `${SITE_URL}/publications`,
  },
  openGraph: {
    title: 'Publications, Poetry & Articles | Excelsior - IET Lucknow',
    description:
      'Discover thought-provoking articles, essays, original poetry, and prose written by students and members of Excelsior, IET Lucknow.',
    url: `${SITE_URL}/publications`,
  },
};

export default function PublicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
