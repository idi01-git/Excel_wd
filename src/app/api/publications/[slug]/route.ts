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
        alumniProfile: {
          select: {
            id: true,
            name: true,
            batch: true,
            branch: true,
            photo: true,
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

    // Run interaction counts and user status in parallel
    const [grouped, userInteractions] = await Promise.all([
      db.interaction.groupBy({
        by: ['type'],
        where: { publicationId: publication.id },
        _count: { _all: true }
      }),
      session?.user?.id
        ? db.interaction.findMany({
            where: {
              publicationId: publication.id,
              userId: session.user.id
            },
            select: { type: true }
          })
        : Promise.resolve([])
    ]);

    const likesCount = grouped.find((g) => g.type === InteractionType.LIKE)?._count._all ?? 0;
    const dislikesCount = grouped.find((g) => g.type === InteractionType.DISLIKE)?._count._all ?? 0;
    const bookmarksCount = grouped.find((g) => g.type === InteractionType.BOOKMARK)?._count._all ?? 0;

    const userLikes = userInteractions.some((i: any) => i.type === InteractionType.LIKE);
    const userDislikes = userInteractions.some((i: any) => i.type === InteractionType.DISLIKE);
    const userBookmarked = userInteractions.some((i: any) => i.type === InteractionType.BOOKMARK);

    const response = NextResponse.json({
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

    if (session?.user?.id) {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    } else {
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    }

    return response;
  } catch (error: any) {
    console.error('Fetch publication detail error:', error);
    return NextResponse.json({ error: 'Failed to retrieve publication' }, { status: 500 });
  }
}
