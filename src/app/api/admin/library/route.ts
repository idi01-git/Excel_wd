// src/app/api/admin/library/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { BookAvailabilityStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const {
      title,
      author,
      coverImage,
      description,
      genre,
      isbn,
      pageCount,
      publishedYear,
      totalCopies,
      availabilityStatus,
      amazonLink
    } = await req.json();

    if (!title || !author || !description || !totalCopies) {
      return NextResponse.json({ error: 'Missing required book details (title, author, description, totalCopies)' }, { status: 400 });
    }

    const genresArray = Array.isArray(genre) 
      ? genre 
      : typeof genre === 'string'
      ? genre.split(',').map((g: string) => g.trim()).filter(Boolean)
      : [];

    const book = await db.book.create({
      data: {
        title,
        author,
        coverImage: coverImage || null,
        description,
        genre: genresArray,
        isbn: isbn || null,
        pageCount: pageCount ? parseInt(pageCount) : null,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        totalCopies: parseInt(totalCopies),
        issuedCopies: 0,
        availabilityStatus: availabilityStatus || BookAvailabilityStatus.AVAILABLE,
        amazonLink: amazonLink || null
      }
    });

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    console.error('Add book error:', error);
    return NextResponse.json({ error: 'Failed to add book to library' }, { status: 500 });
  }
}
