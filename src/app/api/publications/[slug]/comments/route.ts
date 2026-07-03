// src/app/api/publications/[slug]/comments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'new';

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'top') {
      orderBy = { upvotesCount: 'desc' };
    }

    const comments = await db.comment.findMany({
      where: {
        publicationId: slug,
        parentCommentId: null
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, profilePhoto: true }
        },
        upvotes: {
          select: { userId: true }
        },
        downvotes: {
          select: { userId: true }
        },
        replies: {
          include: {
            author: { select: { id: true, name: true, username: true, profilePhoto: true } },
            upvotes: { select: { userId: true } },
            downvotes: { select: { userId: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, username: true, profilePhoto: true } },
                upvotes: { select: { userId: true } },
                downvotes: { select: { userId: true } },
                replies: {
                  include: {
                    author: { select: { id: true, name: true, username: true, profilePhoto: true } },
                    upvotes: { select: { userId: true } },
                    downvotes: { select: { userId: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy
    });

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to retrieve comments' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parentCommentId } = await req.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        publicationId: slug,
        authorId: session.user.id,
        parentCommentId: parentCommentId || null
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, profilePhoto: true }
        }
      }
    });

    // Trigger Notifications & Mentions
    const { createNotification } = await import('@/lib/notifications');

    // 1. Handle Mentions Parsing
    const mentions = content.match(/@([a-zA-Z0-9_]+)/g);
    let mentionedUserIds = new Set<string>();

    if (mentions) {
      const usernames = mentions.map((m: string) => m.slice(1).toLowerCase().trim());
      const matchedUsers = await db.user.findMany({
        where: { username: { in: usernames } },
        select: { id: true }
      });

      for (const matchedUser of matchedUsers) {
        if (matchedUser.id !== session.user.id) {
          mentionedUserIds.add(matchedUser.id);
          await createNotification(
            matchedUser.id,
            'MENTION',
            session.user.id,
            'COMMENT',
            comment.id
          );
        }
      }
    }

    // 2. Handle Reply Notifications (only if the replier didn't mention them)
    if (parentCommentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentCommentId },
        select: { authorId: true }
      });
      if (parentComment && parentComment.authorId !== session.user.id && !mentionedUserIds.has(parentComment.authorId)) {
        await createNotification(
          parentComment.authorId,
          'COMMENT_REPLY',
          session.user.id,
          'COMMENT',
          comment.id
        );
      }
    } else {
      // Top-level comment: Notify the publication author
      const publication = await db.publication.findUnique({
        where: { id: slug }, // slug is the publication ID in this route
        select: { authorId: true }
      });
      if (publication && publication.authorId !== session.user.id && !mentionedUserIds.has(publication.authorId)) {
        await createNotification(
          publication.authorId,
          'COMMENT_REPLY',
          session.user.id,
          'PUBLICATION',
          comment.id
        );
      }
    }

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
