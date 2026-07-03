// src/app/api/comments/[id]/downvote/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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

    const comment = await db.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const result = await db.$transaction(async (tx: any) => {
      // 1. Remove upvote if exists
      const existingUpvote = await tx.commentUpvote.findUnique({
        where: {
          userId_commentId: { userId, commentId }
        }
      });

      let upvoteCountDecrement = 0;
      if (existingUpvote) {
        await tx.commentUpvote.delete({
          where: { id: existingUpvote.id }
        });
        upvoteCountDecrement = 1;
      }

      // Check existing downvote
      const existingDownvote = await tx.commentDownvote.findUnique({
        where: {
          userId_commentId: { userId, commentId }
        }
      });

      let updatedUpvotesCount = comment.upvotesCount;
      let updatedDownvotesCount = comment.downvotesCount;
      let downvoted = false;

      if (existingDownvote) {
        // Remove downvote
        await tx.commentDownvote.delete({
          where: { id: existingDownvote.id }
        });
        
        const updated = await tx.comment.update({
          where: { id: commentId },
          data: { 
            downvotesCount: { decrement: 1 },
            upvotesCount: upvoteCountDecrement > 0 ? { decrement: upvoteCountDecrement } : undefined
          }
        });
        updatedUpvotesCount = updated.upvotesCount;
        updatedDownvotesCount = updated.downvotesCount;
        downvoted = false;
      } else {
        // Create downvote
        await tx.commentDownvote.create({
          data: { userId, commentId }
        });

        const updated = await tx.comment.update({
          where: { id: commentId },
          data: { 
            downvotesCount: { increment: 1 },
            upvotesCount: upvoteCountDecrement > 0 ? { decrement: upvoteCountDecrement } : undefined
          }
        });
        updatedUpvotesCount = updated.upvotesCount;
        updatedDownvotesCount = updated.downvotesCount;
        downvoted = true;
      }

      return { downvoted, upvotesCount: updatedUpvotesCount, downvotesCount: updatedDownvotesCount };
    });

    return NextResponse.json({
      success: true,
      downvoted: result.downvoted,
      upvotesCount: result.upvotesCount,
      downvotesCount: result.downvotesCount
    });

  } catch (error: any) {
    console.error('Comment downvote error:', error);
    return NextResponse.json({ error: 'Failed to register downvote' }, { status: 500 });
  }
}
