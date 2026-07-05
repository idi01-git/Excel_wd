import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordAuditEvent } from '@/lib/audit';
import { toggleCommentVote } from '@/lib/interaction-actions';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const result = await toggleCommentVote({
      commentId,
      userId,
      direction: 'downvote'
    });

    if (!result) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await recordAuditEvent({
      actorId: userId,
      action: result.active ? 'COMMENT_DOWNVOTE_ON' : 'COMMENT_DOWNVOTE_OFF',
      entityType: 'COMMENT',
      entityId: commentId,
      metadata: {
        upvotesCount: result.upvotesCount,
        downvotesCount: result.downvotesCount
      },
      request: req
    });

    return NextResponse.json({
      success: true,
      downvoted: result.active,
      upvotesCount: result.upvotesCount,
      downvotesCount: result.downvotesCount
    });
  } catch (error: any) {
    console.error('Comment downvote error:', error);
    return NextResponse.json({ error: 'Failed to register downvote' }, { status: 500 });
  }
}
