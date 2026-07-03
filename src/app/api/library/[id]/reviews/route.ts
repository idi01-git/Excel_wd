// src/app/api/library/[id]/reviews/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, reviewText } = await req.json();

    if (!rating || !reviewText || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5, and review content is required' }, { status: 400 });
    }

    const book = await db.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check duplicate review
    const existing = await db.bookReview.findUnique({
      where: {
        bookId_reviewerId: {
          bookId,
          reviewerId: session.user.id
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this book' }, { status: 409 });
    }

    const review = await db.bookReview.create({
      data: {
        bookId,
        reviewerId: session.user.id,
        rating: parseInt(rating),
        reviewText: reviewText.trim()
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
