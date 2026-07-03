// src/app/api/moderator/[id]/review/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    if (!session || (userRole !== 'MODERATOR' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Staff access only' }, { status: 403 });
    }

    const { action, note } = await req.json();

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid review action name' }, { status: 400 });
    }

    const pub = await db.publication.findUnique({
      where: { id }
    });

    if (!pub) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (pub.status !== PublicationStatus.PENDING) {
      return NextResponse.json({ error: 'Only pending submissions can be reviewed' }, { status: 400 });
    }

    let updateData: any = {};
    if (action === 'APPROVE') {
      updateData = {
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
        rejectionNote: null // clear if approved
      };
    } else {
      updateData = {
        status: PublicationStatus.REJECTED,
        rejectionNote: note || 'Submission did not meet editorial criteria.'
      };
    }

    const updatedPub = await db.publication.update({
      where: { id },
      data: updateData
    });

    // Dispatch Review & Followers Notifications
    const { createNotification } = await import('@/lib/notifications');
    if (action === 'APPROVE') {
      // 1. Notify author
      await createNotification(
        updatedPub.authorId,
        'SUBMISSION_APPROVED',
        session.user.id,
        'PUBLICATION',
        updatedPub.id
      );

      // 2. Notify followers
      const followers = await db.follow.findMany({
        where: { followingId: updatedPub.authorId },
        select: { followerId: true }
      });

      for (const f of followers) {
        await createNotification(
          f.followerId,
          'NEW_FOLLOWED_POST',
          updatedPub.authorId,
          'PUBLICATION',
          updatedPub.id
        );
      }
    } else {
      // Notify author of rejection
      await createNotification(
        updatedPub.authorId,
        'SUBMISSION_REJECTED',
        session.user.id,
        'PUBLICATION',
        updatedPub.id
      );
    }

    return NextResponse.json({ success: true, publication: updatedPub });
  } catch (error: any) {
    console.error('Review publication error:', error);
    return NextResponse.json({ error: 'Failed to record editorial review decision' }, { status: 500 });
  }
}
