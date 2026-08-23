import { NextResponse } from 'next/server';
import { InteractionType } from '@prisma/client';
import { db } from '@/lib/db';
import { requireLogin } from '@/lib/api-auth';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireLogin();
  if (error || !session) return error;

  try {
    const body: any = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid interaction state' }, { status: 400 });
    }

    const { slug } = await params;
    const publication = await db.publication.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!publication) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    let liked: boolean | undefined = undefined;
    let disliked: boolean | undefined = undefined;
    let bookmarked: boolean | undefined = undefined;

    if (typeof body.liked === 'boolean') liked = body.liked;
    if (typeof body.disliked === 'boolean') disliked = body.disliked;
    if (typeof body.bookmarked === 'boolean') bookmarked = body.bookmarked;

    // Support single-type toggle payload (e.g. { type: 'LIKE' } or { type: 'BOOKMARK' })
    if (body.type) {
      const typeStr = String(body.type).toUpperCase();
      const existing = await db.interaction.findUnique({
        where: {
          userId_publicationId_type: {
            userId: session.user.id,
            publicationId: publication.id,
            type: typeStr as InteractionType,
          },
        },
      });

      const nextActive = body.active !== undefined ? Boolean(body.active) : !existing;
      if (typeStr === 'LIKE') {
        liked = nextActive;
        if (nextActive) disliked = false;
      } else if (typeStr === 'DISLIKE') {
        disliked = nextActive;
        if (nextActive) liked = false;
      } else if (typeStr === 'BOOKMARK') {
        bookmarked = nextActive;
      }
    }

    await db.$transaction(async (tx) => {
      if (liked !== undefined) {
        if (liked) {
          await tx.interaction.upsert({
            where: {
              userId_publicationId_type: {
                userId: session.user.id,
                publicationId: publication.id,
                type: InteractionType.LIKE,
              },
            },
            create: { userId: session.user.id, publicationId: publication.id, type: InteractionType.LIKE },
            update: {},
          });
        } else {
          await tx.interaction.deleteMany({
            where: {
              userId: session.user.id,
              publicationId: publication.id,
              type: InteractionType.LIKE,
            },
          });
        }
      }

      if (disliked !== undefined) {
        if (disliked) {
          await tx.interaction.upsert({
            where: {
              userId_publicationId_type: {
                userId: session.user.id,
                publicationId: publication.id,
                type: InteractionType.DISLIKE,
              },
            },
            create: { userId: session.user.id, publicationId: publication.id, type: InteractionType.DISLIKE },
            update: {},
          });
        } else {
          await tx.interaction.deleteMany({
            where: {
              userId: session.user.id,
              publicationId: publication.id,
              type: InteractionType.DISLIKE,
            },
          });
        }
      }

      if (bookmarked !== undefined) {
        if (bookmarked) {
          await tx.interaction.upsert({
            where: {
              userId_publicationId_type: {
                userId: session.user.id,
                publicationId: publication.id,
                type: InteractionType.BOOKMARK,
              },
            },
            create: { userId: session.user.id, publicationId: publication.id, type: InteractionType.BOOKMARK },
            update: {},
          });
        } else {
          await tx.interaction.deleteMany({
            where: {
              userId: session.user.id,
              publicationId: publication.id,
              type: InteractionType.BOOKMARK,
            },
          });
        }
      }
    });

    // Query fresh counts and current user's interaction status
    const [grouped, userInteractions] = await Promise.all([
      db.interaction.groupBy({
        by: ['type'],
        where: { publicationId: publication.id },
        _count: { _all: true },
      }),
      db.interaction.findMany({
        where: {
          userId: session.user.id,
          publicationId: publication.id,
        },
        select: { type: true },
      }),
    ]);

    const counts = {
      likes: grouped.find((entry) => entry.type === InteractionType.LIKE)?._count._all ?? 0,
      dislikes: grouped.find((entry) => entry.type === InteractionType.DISLIKE)?._count._all ?? 0,
      bookmarks: grouped.find((entry) => entry.type === InteractionType.BOOKMARK)?._count._all ?? 0,
    };

    const userState = {
      liked: userInteractions.some((i) => i.type === InteractionType.LIKE),
      disliked: userInteractions.some((i) => i.type === InteractionType.DISLIKE),
      bookmarked: userInteractions.some((i) => i.type === InteractionType.BOOKMARK),
    };

    return NextResponse.json({ success: true, counts, userState });
  } catch (error: unknown) {
    console.error('Interact API error:', error);
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}