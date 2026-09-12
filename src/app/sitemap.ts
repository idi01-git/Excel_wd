// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600; // Cache and revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // 1. Core Static Hubs
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/publications`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/editors-shelf`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community/members`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community/alumni`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/community/library`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/community/achievements`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/community/gallery`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  try {
    const [publications, events, shelfItems, members, books] = await Promise.all([
      db.publication.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        take: 1000,
      }).catch(() => []),
      db.event.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { slug: true, updatedAt: true },
        take: 500,
      }).catch(() => []),
      db.editorShelfItem.findMany({
        select: { slug: true, updatedAt: true },
        take: 500,
      }).catch(() => []),
      db.user.findMany({
        where: { isVerified: true },
        select: { username: true, updatedAt: true },
        take: 500,
      }).catch(() => []),
      db.book.findMany({
        select: { id: true, updatedAt: true },
        take: 500,
      }).catch(() => []),
    ]);

    const publicationRoutes: MetadataRoute.Sitemap = publications.map((pub) => ({
      url: `${baseUrl}/publications/${pub.slug}`,
      lastModified: pub.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const eventRoutes: MetadataRoute.Sitemap = events.map((ev) => ({
      url: `${baseUrl}/events/${ev.slug}`,
      lastModified: ev.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const shelfRoutes: MetadataRoute.Sitemap = shelfItems.map((item) => ({
      url: `${baseUrl}/editors-shelf/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

    const memberRoutes: MetadataRoute.Sitemap = members.map((user) => ({
      url: `${baseUrl}/profile/${user.username}`,
      lastModified: user.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

    const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
      url: `${baseUrl}/community/library/${book.id}`,
      lastModified: book.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

    return [
      ...staticRoutes,
      ...publicationRoutes,
      ...eventRoutes,
      ...shelfRoutes,
      ...memberRoutes,
      ...bookRoutes,
    ];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
