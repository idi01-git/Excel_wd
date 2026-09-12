// src/app/(main)/events/[slug]/layout.tsx
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SITE_URL, generateEventSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const event = await db.event.findUnique({
      where: { slug },
    });

    if (!event) {
      return {
        title: 'Event | Excelsior - IET Lucknow',
      };
    }

    const title = `${event.title} | Excelsior IET Lucknow`;
    const description = `${event.description?.slice(0, 155) || 'Event organized by Excelsior, the Literary Club of IET Lucknow.'}...`;
    const canonicalUrl = `${SITE_URL}/events/${slug}`;
    const imageUrl = event.coverImage || event.posterImage || `${SITE_URL}/favicon.ico`;

    return {
      title,
      description,
      keywords: [
        event.title,
        'Excelsior Events',
        'IET Lucknow Event',
        'IET Lucknow Literary Club',
        event.venue,
      ],
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: 'website',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: event.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating event metadata:', error);
    return {
      title: 'Event | Excelsior - IET Lucknow',
    };
  }
}

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let schemaData = null;
  try {
    const event = await db.event.findUnique({
      where: { slug },
    });

    if (event) {
      schemaData = generateEventSchema({
        title: event.title,
        description: event.description,
        slug: event.slug,
        date: event.date,
        venue: event.venue,
        image: event.coverImage || event.posterImage,
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
