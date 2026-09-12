// src/app/(main)/publications/[slug]/layout.tsx
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SITE_URL, generateArticleSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const pub = await db.publication.findUnique({
      where: { slug },
      include: {
        author: {
          select: { name: true },
        },
      },
    });

    if (!pub) {
      return {
        title: 'Publication | Excelsior - IET Lucknow',
      };
    }

    const authorName = pub.authorName || pub.author?.name || 'Excelsior Contributor';
    const title = `${pub.title} — by ${authorName} | Excelsior IET Lucknow`;
    
    // Clean snippet from content or fallback
    let description = `Read "${pub.title}", an original ${pub.category.toLowerCase()} by ${authorName}, published in Excelsior, the Literary Club of IET Lucknow.`;
    if (pub.authorNote) {
      description = `${pub.authorNote.slice(0, 150)}...`;
    }

    const canonicalUrl = `${SITE_URL}/publications/${slug}`;
    const coverImageUrl = pub.coverImage || `${SITE_URL}/favicon.ico`;

    return {
      title,
      description,
      keywords: [
        pub.title,
        authorName,
        'Excelsior IET Lucknow',
        'IET Lucknow Publications',
        pub.category,
        ...(pub.tags || []),
      ],
      authors: [{ name: authorName }],
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: 'article',
        publishedTime: pub.publishedAt?.toISOString() || pub.createdAt.toISOString(),
        modifiedTime: pub.updatedAt.toISOString(),
        authors: [authorName],
        images: [
          {
            url: coverImageUrl,
            width: 1200,
            height: 630,
            alt: pub.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [coverImageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating publication metadata:', error);
    return {
      title: 'Publication | Excelsior - IET Lucknow',
    };
  }
}

export default async function PublicationDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let schemaData = null;
  try {
    const pub = await db.publication.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    });

    if (pub) {
      const authorName = pub.authorName || pub.author?.name || 'Excelsior Contributor';
      schemaData = generateArticleSchema({
        title: pub.title,
        description: pub.authorNote || `An original ${pub.category.toLowerCase()} published by ${authorName} in Excelsior, IET Lucknow.`,
        slug: pub.slug,
        coverImage: pub.coverImage,
        authorName,
        datePublished: pub.publishedAt?.toISOString() || pub.createdAt.toISOString(),
        dateModified: pub.updatedAt.toISOString(),
      });
    }
  } catch {
    // Graceful fallback
  }

  return (
    <>
      {schemaData && <JsonLd data={schemaData} />}
      {children}
    </>
  );
}
