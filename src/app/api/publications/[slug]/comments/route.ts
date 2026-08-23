import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordAuditEvent } from '@/lib/audit';
import { resolvePublicationReference } from '@/lib/interaction-actions';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'new';
    const publication = await resolvePublicationReference(slug);

    if (!publication) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'top') {
      orderBy = { upvotesCount: 'desc' };
    }

    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : undefined;

    const [comments, totalCount] = await Promise.all([
      db.comment.findMany({
        where: {
          publicationId: publication.id,
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
        orderBy,
        ...(limit ? { take: limit } : {})
      }),
      db.comment.count({
        where: {
          publicationId: publication.id,
          parentCommentId: null
        }
      })
    ]);

    const hasMore = limit ? totalCount > comments.length : false;

    const response = NextResponse.json({
      success: true,
      comments,
      totalCount,
      hasMore
    });
    response.headers.set('Cache-Control', 'public, s-maxage=3, stale-while-revalidate=15');
    return response;
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
    const publication = await resolvePublicationReference(slug);

    if (!publication) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        publicationId: publication.id,
        authorId: session.user.id,
        parentCommentId: parentCommentId || null,
        upvotesCount: 1,
        upvotes: {
          create: {
            userId: session.user.id
          }
        }
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, profilePhoto: true }
        },
        upvotes: { select: { userId: true } },
        downvotes: { select: { userId: true } }
      }
    });

    const { createNotification } = await import('@/lib/notifications');

    const mentions = content.match(/@([a-zA-Z0-9_]+)/g);
    const mentionedUserIds = new Set<string>();

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
    } else if (publication.authorId !== session.user.id && !mentionedUserIds.has(publication.authorId)) {
      await createNotification(
        publication.authorId,
        'COMMENT_REPLY',
        session.user.id,
        'PUBLICATION',
        comment.id
      );
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: parentCommentId ? 'COMMENT_REPLY' : 'COMMENT_CREATE',
      entityType: 'COMMENT',
      entityId: comment.id,
      metadata: {
        publicationId: publication.id,
        publicationSlug: publication.slug,
        parentCommentId: parentCommentId || null
      },
      request: req
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
