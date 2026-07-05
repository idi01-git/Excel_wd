import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordAuditEvent } from '@/lib/audit';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;
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

    const { content } = await req.json();

    const comment = await db.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.authorId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this comment' }, { status: 403 });
    }

    if (comment.isDeleted) {
      return NextResponse.json({ error: 'Cannot edit a deleted comment' }, { status: 400 });
    }

    const updated = await db.comment.update({
      where: { id },
      data: { content: content.trim() }
    });

    await recordAuditEvent({
      actorId: user.id,
      action: 'COMMENT_EDIT',
      entityType: 'COMMENT',
      entityId: id,
      metadata: {
        contentLength: content.trim().length
      },
      request: req
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (error: any) {
    console.error('Edit comment error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
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

    const comment = await db.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAuthor = comment.authorId === user.id;
    const isStaff = user.role === 'MODERATOR' || user.role === 'ADMIN';

    if (!isAuthor && !isStaff) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    const softDeleted = await db.comment.update({
      where: { id },
      data: {
        content: '[deleted]',
        isDeleted: true
      }
    });

    await recordAuditEvent({
      actorId: user.id,
      action: 'COMMENT_DELETE',
      entityType: 'COMMENT',
      entityId: id,
      metadata: {
        softDeleted: true
      },
      request: req
    });

    return NextResponse.json({ success: true, comment: softDeleted });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
