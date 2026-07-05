import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordAuditEvent } from '@/lib/audit';
import { togglePublicationInteraction } from '@/lib/interaction-actions';
import { InteractionType } from '@prisma/client';

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

    const userId = session.user.id;
    const { type } = await req.json();

    if (!type || !Object.values(InteractionType).includes(type)) {
      return NextResponse.json({ error: 'Invalid interaction type' }, { status: 400 });
    }

    const result = await togglePublicationInteraction({
      publicationReference: slug,
      userId,
      type
    });

    if (!result) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (type === InteractionType.LIKE && result.active) {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification(result.publication.authorId, 'LIKE', userId, 'PUBLICATION', result.publication.id);
    }

    await recordAuditEvent({
      actorId: userId,
      action: `PUBLICATION_${type}${result.active ? '_ON' : '_OFF'}`,
      entityType: 'PUBLICATION',
      entityId: result.publication.id,
      metadata: {
        slug: result.publication.slug,
        type,
        active: result.active
      },
      request: req
    });

    return NextResponse.json({
      success: true,
      active: result.active,
      stats: result.stats
    });
  } catch (error: any) {
    console.error('Interact API error:', error);
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}
