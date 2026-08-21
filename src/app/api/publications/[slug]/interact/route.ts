import { NextResponse } from 'next/server';
import { InteractionType } from '@prisma/client';
import { db } from '@/lib/db';
import { requireLogin } from '@/lib/api-auth';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireLogin();
  if (error || !session) return error;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid interaction state' }, { status: 400 });
    const { liked, disliked, bookmarked } = body as Record<string, unknown>;
    if (typeof liked !== 'boolean' || typeof disliked !== 'boolean' || typeof bookmarked !== 'boolean' || (liked && disliked)) return NextResponse.json({ error: 'Invalid interaction state' }, { status: 400 });
    const { slug } = await params;
    const publication = await db.publication.findUnique({ where: { slug }, select: { id: true } });
    if (!publication) return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    const desired = [{ type: InteractionType.LIKE, active: liked }, { type: InteractionType.DISLIKE, active: disliked }, { type: InteractionType.BOOKMARK, active: bookmarked }];
    const counts = await db.$transaction(async (tx) => {
      for (const item of desired) {
        const where = { userId_publicationId_type: { userId: session.user.id, publicationId: publication.id, type: item.type } };
        if (item.active) await tx.interaction.upsert({ where, create: { userId: session.user.id, publicationId: publication.id, type: item.type }, update: {} });
        else await tx.interaction.deleteMany({ where: { userId: session.user.id, publicationId: publication.id, type: item.type } });
      }
      const grouped = await tx.interaction.groupBy({ by: ['type'], where: { publicationId: publication.id }, _count: { _all: true } });
      return { likes: grouped.find((entry) => entry.type === InteractionType.LIKE)?._count._all ?? 0, dislikes: grouped.find((entry) => entry.type === InteractionType.DISLIKE)?._count._all ?? 0, bookmarks: grouped.find((entry) => entry.type === InteractionType.BOOKMARK)?._count._all ?? 0 };
    });
    return NextResponse.json({ success: true, counts });
  } catch (error: unknown) {
    console.error('Interact API error:', error);
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}