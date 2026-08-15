// src/app/api/admin/library/issue-requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { IssueRequestStatus, BookAvailabilityStatus } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { action, adminNote, dueDate } = await req.json();

    if (action !== 'APPROVE' && action !== 'REJECT' && action !== 'RETURN') {
      return NextResponse.json({ error: 'Invalid loan status action' }, { status: 400 });
    }

    const request = await db.issueRequest.findUnique({
      where: { id },
      include: { book: true }
    });

    if (!request) {
      return NextResponse.json({ error: 'Issue request not found' }, { status: 404 });
    }

    // Run transaction
    const updated = await db.$transaction(async (tx) => {
      let targetStatus = request.status;
      let issueDate = request.issueDate;
      let returnDate = request.returnDate;

      if (action === 'APPROVE') {
        if (request.status !== IssueRequestStatus.PENDING) {
          throw new Error('Only PENDING requests can be approved');
        }

        // Check if there are available copies in stock
        const currentBook = await tx.book.findUnique({
          where: { id: request.bookId }
        });

        if (!currentBook) {
          throw new Error('This book does not exist in the catalog.');
        }

        if (currentBook.issuedCopies >= currentBook.totalCopies) {
          throw new Error(`Cannot approve: All ${currentBook.totalCopies} copies of "${currentBook.title}" are currently checked out.`);
        }

        targetStatus = IssueRequestStatus.APPROVED;
        issueDate = new Date();

        // Increment issuedCopies on book
        const book = await tx.book.update({
          where: { id: request.bookId },
          data: {
            issuedCopies: { increment: 1 }
          }
        });

        // Toggle availabilityStatus to ISSUED if at capacity
        if (book.issuedCopies >= book.totalCopies) {
          await tx.book.update({
            where: { id: request.bookId },
            data: { availabilityStatus: BookAvailabilityStatus.ISSUED }
          });
        }
      } else if (action === 'REJECT') {
        if (request.status !== IssueRequestStatus.PENDING) {
          throw new Error('Only PENDING requests can be rejected');
        }
        targetStatus = IssueRequestStatus.REJECTED;
      } else if (action === 'RETURN') {
        if (request.status !== IssueRequestStatus.APPROVED) {
          throw new Error('Only APPROVED loans can be returned');
        }
        targetStatus = IssueRequestStatus.RETURNED;
        returnDate = new Date();

        // Decrement issuedCopies on book
        const book = await tx.book.update({
          where: { id: request.bookId },
          data: {
            issuedCopies: { decrement: 1 }
          }
        });

        // Set status back to AVAILABLE if below capacity
        if (book.issuedCopies < book.totalCopies) {
          await tx.book.update({
            where: { id: request.bookId },
            data: { availabilityStatus: BookAvailabilityStatus.AVAILABLE }
          });
        }
      }

      const updatedRequest = await tx.issueRequest.update({
        where: { id },
        data: {
          status: targetStatus,
          issueDate,
          returnDate,
          dueDate: action === 'APPROVE' && dueDate ? new Date(dueDate) : undefined,
          adminNote: adminNote || request.adminNote,
          approverId: action === 'APPROVE' ? session.user.id : undefined,
          returnerId: action === 'RETURN' ? session.user.id : undefined
        }
      });

      return updatedRequest;
    });

    // Create notifications for the requester
    const { createNotification } = await import('@/lib/notifications');
    if (action === 'APPROVE') {
      await createNotification(
        request.requesterId,
        'ISSUE_REQUEST_APPROVED',
        session.user.id,
        'BOOK',
        request.bookId,
        adminNote || request.adminNote
      );
    } else if (action === 'REJECT') {
      await createNotification(
        request.requesterId,
        'ISSUE_REQUEST_REJECTED',
        session.user.id,
        'BOOK',
        request.bookId,
        adminNote || request.adminNote
      );
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Update issue request status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update request' }, { status: 500 });
  }
}
