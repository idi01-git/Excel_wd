import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const { reviewText, rating } = await req.json();

    if (!reviewText) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }

    // Check if user already reviewed
    const existing = await db.bookReview.findUnique({
      where: {
        bookId_reviewerId: {
          bookId: resolvedParams.id,
          reviewerId: (session.user as any).id
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this book' }, { status: 400 });
    }

    const review = await db.bookReview.create({
      data: {
        bookId: resolvedParams.id,
        reviewerId: (session.user as any).id,
        reviewText,
        rating: rating || 5,
      },
      include: {
        reviewer: true
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
