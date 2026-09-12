// src/app/(main)/profile/[username]/layout.tsx
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  try {
    const user = await db.user.findUnique({
      where: { username },
      select: {
        name: true,
        username: true,
        bio: true,
        memberTitle: true,
        profilePhoto: true,
      },
    });

    if (!user) {
      return {
        title: 'Profile | Excelsior - IET Lucknow',
      };
    }

    const title = `${user.name} (@${user.username}) | Excelsior - IET Lucknow`;
    const description = user.bio
      ? `${user.bio.slice(0, 155)}...`
      : `${user.name} is a writer and contributor at Excelsior, the Literary Club of IET Lucknow.`;
    const canonicalUrl = `${SITE_URL}/profile/${username}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images: user.profilePhoto ? [{ url: user.profilePhoto }] : undefined,
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  } catch (error) {
    return {
      title: 'Profile | Excelsior - IET Lucknow',
    };
  }
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
