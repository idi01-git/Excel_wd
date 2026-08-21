// src/app/api/admin/library/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BookAvailabilityStatus } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';

export async function GET() {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const books = await db.book.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { reviews: true, issueRequests: true },
        },
      },
    });

    return NextResponse.json({ success: true, books });
  } catch (error: unknown) {
    console.error('List library books error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve books' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const {
      title,
      author,
      language,
      coverImage,
      description,
      genre,
      isbn,
      pageCount,
      publishedYear,
      totalCopies,
      availabilityStatus,
      amazonLink,
      downloadLink,
      clubReview,
      editorPickType,
    } = await req.json();

    if (!title || !author || !description || !totalCopies) {
      return NextResponse.json(
        {
          error:
            'Missing required book details (title, author, description, totalCopies)',
        },
        { status: 400 }
      );
    }

    const genresArray = Array.isArray(genre)
      ? genre
      : typeof genre === 'string'
      ? genre.split(',').map((g: string) => g.trim()).filter(Boolean)
      : [];

    const bookLanguage = language === 'HINDI' ? 'HINDI' : 'ENGLISH';

    const book = await db.book.create({
      data: {
        title,
        author,
        language: bookLanguage,
        coverImage: coverImage || null,
        description,
        genre: genresArray,
        isbn: isbn || null,
        pageCount: pageCount ? parseInt(pageCount) : null,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        totalCopies: parseInt(totalCopies),
        issuedCopies: 0,
        availabilityStatus:
          availabilityStatus || BookAvailabilityStatus.AVAILABLE,
        amazonLink: amazonLink || null,
        downloadLink: downloadLink || null,
        clubReview: clubReview || null,
        editorPickType: editorPickType || null,
      },
    });

    return NextResponse.json({ success: true, book });
  } catch (error: unknown) {
    console.error('Add book error:', error);
    return NextResponse.json(
      { error: 'Failed to add book to library' },
      { status: 500 }
    );
  }
}
