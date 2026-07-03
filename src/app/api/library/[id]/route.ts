// src/app/api/library/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { IssueRequestStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const book = await db.book.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                profilePhoto: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Recalculate average rating
    const totalReviews = book.reviews.length;
    const avgRating = totalReviews > 0
      ? parseFloat((book.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    // Check user states
    let hasRequested = false;
    let activeRequest: any = null;
    let hasReviewed = false;
    let userReview: any = null;

    if (session?.user) {
      // Find active borrow request
      const request = await db.issueRequest.findFirst({
        where: {
          bookId: id,
          requesterId: session.user.id,
          status: {
            in: [IssueRequestStatus.PENDING, IssueRequestStatus.APPROVED]
          }
        }
      });
      if (request) {
        hasRequested = true;
        activeRequest = request;
      }

      // Find user review
      const review = book.reviews.find(r => r.reviewerId === session.user.id);
      if (review) {
        hasReviewed = true;
        userReview = review;
      }
    }

    return NextResponse.json({
      success: true,
      book,
      stats: {
        avgRating,
        totalReviews
      },
      userState: {
        hasRequested,
        activeRequest,
        hasReviewed,
        userReview
      }
    });
  } catch (error: any) {
    console.error('Fetch book details error:', error);
    return NextResponse.json({ error: 'Failed to retrieve book details' }, { status: 500 });
  }
}
