// src/app/api/publications/[slug]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { InteractionType } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    const publication = await db.publication.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
            bio: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    if (!publication) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    // Query interactions count
    const likesCount = await db.interaction.count({
      where: { publicationId: publication.id, type: InteractionType.LIKE }
    });
    
    const dislikesCount = await db.interaction.count({
      where: { publicationId: publication.id, type: InteractionType.DISLIKE }
    });

    const bookmarksCount = await db.interaction.count({
      where: { publicationId: publication.id, type: InteractionType.BOOKMARK }
    });

    // Check current user state
    let userLikes = false;
    let userDislikes = false;
    let userBookmarked = false;

    if (session?.user) {
      const userInteractions = await db.interaction.findMany({
        where: {
          publicationId: publication.id,
          userId: session.user.id
        }
      });

      userLikes = userInteractions.some((i: any) => i.type === InteractionType.LIKE);
      userDislikes = userInteractions.some((i: any) => i.type === InteractionType.DISLIKE);
      userBookmarked = userInteractions.some((i: any) => i.type === InteractionType.BOOKMARK);
    }

    return NextResponse.json({
      success: true,
      publication,
      stats: {
        likes: likesCount,
        dislikes: dislikesCount,
        bookmarks: bookmarksCount
      },
      userState: {
        liked: userLikes,
        disliked: userDislikes,
        bookmarked: userBookmarked
      }
    });
  } catch (error: any) {
    console.error('Fetch publication detail error:', error);
    return NextResponse.json({ error: 'Failed to retrieve publication' }, { status: 500 });
  }
}
