// src/app/api/comments/[id]/upvote/route.ts
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
      // 1. Remove downvote if exists
      const existingDownvote = await tx.commentDownvote.findUnique({
        where: {
          userId_commentId: { userId, commentId }
        }
      });

      let downvoteCountDecrement = 0;
      if (existingDownvote) {
        await tx.commentDownvote.delete({
          where: { id: existingDownvote.id }
        });
        downvoteCountDecrement = 1;
      }

      // Check existing upvote
      const existingUpvote = await tx.commentUpvote.findUnique({
        where: {
          userId_commentId: { userId, commentId }
        }
      });

      let updatedUpvotesCount = comment.upvotesCount;
      let updatedDownvotesCount = comment.downvotesCount;
      let upvoted = false;

      if (existingUpvote) {
        // Remove upvote
        await tx.commentUpvote.delete({
          where: { id: existingUpvote.id }
        });
        
        const updated = await tx.comment.update({
          where: { id: commentId },
          data: { 
            upvotesCount: { decrement: 1 },
            downvotesCount: downvoteCountDecrement > 0 ? { decrement: downvoteCountDecrement } : undefined
          }
        });
        updatedUpvotesCount = updated.upvotesCount;
        updatedDownvotesCount = updated.downvotesCount;
        upvoted = false;
      } else {
        // Create upvote
        await tx.commentUpvote.create({
          data: { userId, commentId }
        });

        const updated = await tx.comment.update({
          where: { id: commentId },
          data: { 
            upvotesCount: { increment: 1 },
            downvotesCount: downvoteCountDecrement > 0 ? { decrement: downvoteCountDecrement } : undefined
          }
        });
        updatedUpvotesCount = updated.upvotesCount;
        updatedDownvotesCount = updated.downvotesCount;
        upvoted = true;
      }

      return { upvoted, upvotesCount: updatedUpvotesCount, downvotesCount: updatedDownvotesCount };
    });

    return NextResponse.json({
      success: true,
      upvoted: result.upvoted,
      upvotesCount: result.upvotesCount,
      downvotesCount: result.downvotesCount
    });

  } catch (error: any) {
    console.error('Comment upvote error:', error);
    return NextResponse.json({ error: 'Failed to register upvote' }, { status: 500 });
  }
}
