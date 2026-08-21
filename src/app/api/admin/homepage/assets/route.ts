import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requirePermission('MANAGE_HOMEPAGE_CMS');
  if (error) return error;

  const [events, publications, books, libraryBooks, alumni] = await Promise.all([
    db.event.findMany({
      select: { id: true, title: true, date: true, venue: true, posterImage: true, slug: true },
      orderBy: { date: 'desc' },
    }),
    db.publication.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        coverImage: true,
        slug: true,
        category: true,
        readingTime: true,
        authorName: true,
        authorNote: true,
        alumniProfile: { select: { name: true, batch: true } },
        author: { select: { name: true } },
      },
      take: 100,
      orderBy: { publishedAt: 'desc' },
    }),
    db.editorShelfItem.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        coverImage: true,
        slug: true,
        excerpt: true,
        synopsis: true,
        genre: true,
      },
      take: 100,
      orderBy: { displayOrder: 'asc' },
    }),
    db.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        coverImage: true,
        description: true,
        genre: true,
        pageCount: true,
        publishedYear: true,
      },
      take: 100,
      orderBy: { title: 'asc' },
    }),
    db.alumniProfile.findMany({
      where: { message: { not: null } },
      select: { id: true, name: true, batch: true, currentPosition: true, message: true },
      take: 100,
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return NextResponse.json({ success: true, events, publications, books, libraryBooks, alumni });
}