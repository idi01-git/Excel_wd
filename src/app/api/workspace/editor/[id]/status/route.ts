// src/app/api/workspace/editor/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';

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

    if (action === 'SUBMIT') {
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
        rejectionNote: action === 'RESUBMIT' ? null : pub.rejectionNote // clear notes on resubmit
      }
    });

    return NextResponse.json({ success: true, publication: updatedPub });
  } catch (error: any) {
    console.error('Status patch error:', error);
    return NextResponse.json({ error: 'Failed to update publication status' }, { status: 500 });
  }
}
