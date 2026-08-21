// src/app/api/workspace/editor/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';
import { hasPermission } from '@/lib/rbac';
import { createNotification } from '@/lib/notifications';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;
  return session.user;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json();

    const pub = await db.publication.findUnique({
      where: { id }
    });

    if (!pub) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (pub.authorId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let targetStatus: PublicationStatus = pub.status;
    let newPublishedAt = pub.publishedAt;

    if (action === 'PUBLISH') {
      const canPublishDirectly = hasPermission(user.role, 'MODERATE_PUBLICATIONS');
      if (!canPublishDirectly) {
        return NextResponse.json({ error: 'Direct publishing requires editorial staff permissions' }, { status: 403 });
      }
      targetStatus = PublicationStatus.PUBLISHED;
      newPublishedAt = pub.publishedAt || new Date();
    } else if (action === 'SUBMIT') {
      if (pub.status !== PublicationStatus.DRAFT) {
        return NextResponse.json({ error: 'Only DRAFT publications can be submitted' }, { status: 400 });
      }
      targetStatus = PublicationStatus.PENDING;
    } else if (action === 'WITHDRAW') {
      if (pub.status !== PublicationStatus.PENDING) {
        return NextResponse.json({ error: 'Only PENDING publications can be withdrawn' }, { status: 400 });
      }
      targetStatus = PublicationStatus.DRAFT;
    } else if (action === 'RESUBMIT') {
      if (pub.status !== PublicationStatus.REJECTED) {
        return NextResponse.json({ error: 'Only REJECTED publications can be resubmitted' }, { status: 400 });
      }
      targetStatus = PublicationStatus.PENDING;
    } else {
      return NextResponse.json({ error: 'Invalid action name' }, { status: 400 });
    }

    const updatedPub = await db.publication.update({
      where: { id },
      data: {
        status: targetStatus,
        publishedAt: newPublishedAt,
        rejectionNote: (action === 'RESUBMIT' || action === 'PUBLISH') ? null : pub.rejectionNote
      }
    });

    if (action === 'PUBLISH') {
      try {
        const followers = await db.follow.findMany({
          where: { followingId: updatedPub.authorId },
          select: { followerId: true },
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
      } catch (notifErr) {
        console.error('Failed to send follower notifications on direct publish:', notifErr);
      }
    }

    return NextResponse.json({ success: true, publication: updatedPub });
  } catch (error: any) {
    console.error('Status patch error:', error);
    return NextResponse.json({ error: 'Failed to update publication status' }, { status: 500 });
  }
}
