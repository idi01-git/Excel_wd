// src/app/api/library/[id]/issue-request/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { BookAvailabilityStatus, IssueRequestStatus } from '@prisma/client';

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

    if (session.user.role === 'VISITOR' || session.user.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Book borrowing is exclusively reserved for verified Excelsior Society members.' },
        { status: 403 }
      );
    }

    const { returnDate } = await req.json();

    if (!returnDate) {
      return NextResponse.json({ error: 'Expected return date is required' }, { status: 400 });
    }

    // Run transaction
    const result = await db.$transaction(async (tx) => {
      const book = await tx.book.findUnique({
        where: { id: bookId }
      });

      if (!book) {
        throw new Error('BOOK_NOT_FOUND');
      }

      // Stock check
      if (book.availabilityStatus !== BookAvailabilityStatus.AVAILABLE || book.issuedCopies >= book.totalCopies) {
        throw new Error('OUT_OF_STOCK');
      }

      // Check active request
      const existing = await tx.issueRequest.findFirst({
        where: {
          bookId,
          requesterId: session.user.id,
          status: {
            in: [IssueRequestStatus.PENDING, IssueRequestStatus.APPROVED]
          }
        }
      });

      if (existing) {
        throw new Error('DUPLICATE_ACTIVE_REQUEST');
      }

      const request = await tx.issueRequest.create({
        data: {
          bookId,
          requesterId: session.user.id,
          status: IssueRequestStatus.PENDING,
          dueDate: new Date(returnDate) // User's requested return date
        }
      });

      return { success: true, request };
    });

    return NextResponse.json({ success: true, request: result.request });
  } catch (error: any) {
    console.error('Create issue request error:', error);
    if (error.message === 'BOOK_NOT_FOUND') {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    if (error.message === 'OUT_OF_STOCK') {
      return NextResponse.json({ error: 'This book is currently out of stock / checked out' }, { status: 400 });
    }
    if (error.message === 'DUPLICATE_ACTIVE_REQUEST') {
      return NextResponse.json({ error: 'You already have an active request or checkout for this book' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create issue request' }, { status: 500 });
  }
}
