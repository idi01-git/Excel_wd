// src/app/api/publications/[slug]/interact/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { InteractionType } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: publicationId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { type } = await req.json();

    if (!type || !Object.values(InteractionType).includes(type)) {
      return NextResponse.json({ error: 'Invalid interaction type' }, { status: 400 });
    }

    // Run interact toggle inside a Prisma Transaction
    const result = await db.$transaction(async (tx: any) => {
      if (type === InteractionType.LIKE) {
        // 1. Remove Dislike if exists
        await tx.interaction.deleteMany({
          where: { userId, publicationId, type: InteractionType.DISLIKE }
        });

        // 2. Check and Toggle Like
        const existingLike = await tx.interaction.findUnique({
          where: {
            userId_publicationId_type: {
              userId,
              publicationId,
              type: InteractionType.LIKE
            }
          }
        });

        if (existingLike) {
          await tx.interaction.delete({
            where: { id: existingLike.id }
          });
          return { active: false };
        } else {
          await tx.interaction.create({
            data: { userId, publicationId, type: InteractionType.LIKE }
          });
          return { active: true };
        }
      }

      if (type === InteractionType.DISLIKE) {
        // 1. Remove Like if exists
        await tx.interaction.deleteMany({
          where: { userId, publicationId, type: InteractionType.LIKE }
        });

        // 2. Check and Toggle Dislike
        const existingDislike = await tx.interaction.findUnique({
          where: {
            userId_publicationId_type: {
              userId,
              publicationId,
              type: InteractionType.DISLIKE
            }
          }
        });

        if (existingDislike) {
          await tx.interaction.delete({
            where: { id: existingDislike.id }
          });
          return { active: false };
        } else {
          await tx.interaction.create({
            data: { userId, publicationId, type: InteractionType.DISLIKE }
          });
          return { active: true };
        }
      }

      if (type === InteractionType.BOOKMARK) {
        // Toggle Bookmark
        const existingBookmark = await tx.interaction.findUnique({
          where: {
            userId_publicationId_type: {
              userId,
              publicationId,
              type: InteractionType.BOOKMARK
            }
          }
        });

        if (existingBookmark) {
          await tx.interaction.delete({
            where: { id: existingBookmark.id }
          });
          return { active: false };
        } else {
          await tx.interaction.create({
            data: { userId, publicationId, type: InteractionType.BOOKMARK }
          });
          return { active: true };
        }
      }

      return { active: false };
    });

    // Fetch publication to get authorId for notification
    const pub = await db.publication.findUnique({
      where: { id: publicationId },
      select: { authorId: true }
    });

    if (pub && type === InteractionType.LIKE && result.active) {
      // Import notification dispatcher dynamically or globally
      const { createNotification } = await import('@/lib/notifications');
      await createNotification(pub.authorId, 'LIKE', userId, 'PUBLICATION', publicationId);
    }

    // Recalculate stats for response
    const likesCount = await db.interaction.count({
      where: { publicationId, type: InteractionType.LIKE }
    });
    const dislikesCount = await db.interaction.count({
      where: { publicationId, type: InteractionType.DISLIKE }
    });
    const bookmarksCount = await db.interaction.count({
      where: { publicationId, type: InteractionType.BOOKMARK }
    });

    return NextResponse.json({
      success: true,
      active: result.active,
      stats: {
        likes: likesCount,
        dislikes: dislikesCount,
        bookmarks: bookmarksCount
      }
    });

  } catch (error: any) {
    console.error('Interact API error:', error);
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}
