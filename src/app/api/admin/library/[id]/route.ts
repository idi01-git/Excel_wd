// src/app/api/admin/library/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { IssueRequestStatus, BookAvailabilityStatus } from '@prisma/client';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session.user;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const book = await db.book.findUnique({
      where: { id }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const genresArray = Array.isArray(genre) 
      ? genre 
      : typeof genre === 'string'
      ? genre.split(',').map((g: string) => g.trim()).filter(Boolean)
      : book.genre;

    const parsedTotalCopies = totalCopies ? parseInt(totalCopies) : book.totalCopies;
    const status = availabilityStatus || book.availabilityStatus;

    const updated = await db.book.update({
      where: { id },
      data: {
        title: title || book.title,
        author: author || book.author,
        coverImage: coverImage !== undefined ? coverImage : book.coverImage,
        description: description || book.description,
        genre: genresArray,
        isbn: isbn !== undefined ? isbn : book.isbn,
        pageCount: pageCount ? parseInt(pageCount) : book.pageCount,
        publishedYear: publishedYear ? parseInt(publishedYear) : book.publishedYear,
        totalCopies: parsedTotalCopies,
        availabilityStatus: status,
        amazonLink: amazonLink !== undefined ? amazonLink : book.amazonLink
      }
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error: any) {
    console.error('Update library book error:', error);
    return NextResponse.json({ error: 'Failed to update book details' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check active issue requests
    const activeRequests = await db.issueRequest.count({
      where: {
        bookId: id,
        status: {
          in: [IssueRequestStatus.PENDING, IssueRequestStatus.APPROVED]
        }
      }
    });

    if (activeRequests > 0) {
      return NextResponse.json({
        error: 'Cannot delete book: active issue requests or checkouts exist.'
      }, { status: 400 });
    }

    // Delete reviews first to satisfy foreign key constraints
    await db.bookReview.deleteMany({ where: { bookId: id } });
    await db.issueRequest.deleteMany({ where: { bookId: id } });
    await db.book.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete book error:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
