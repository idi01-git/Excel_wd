// src/app/api/reviews/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, reviewText } = await req.json();

    if (!rating || !reviewText || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5, and content is required' }, { status: 400 });
    }

    const review = await db.bookReview.findUnique({
      where: { id }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.reviewerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this review' }, { status: 403 });
    }

    const updated = await db.bookReview.update({
      where: { id },
      data: {
        rating: parseInt(rating),
        reviewText: reviewText.trim()
      }
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const review = await db.bookReview.findUnique({
      where: { id }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.reviewerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You do not own this review' }, { status: 403 });
    }

    await db.bookReview.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
