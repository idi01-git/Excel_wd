// src/app/api/admin/events/[id]/winners/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WinnerPosition } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_EVENTS');
    if (error || !session) return error;

    const { id: eventId } = await params;
    const { winners } = await req.json();

    if (!winners || !Array.isArray(winners)) {
      return NextResponse.json(
        { error: 'Missing winners list data' },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find existing winner photos to clean up unreferenced ones
    const existingWinners = await db.eventWinner.findMany({
      where: { eventId },
      select: { photoUrl: true },
    });

    const newPhotoUrls = new Set(winners.map((w: any) => w.photoUrl).filter(Boolean));
    const photosToDelete = existingWinners
      .map((w) => w.photoUrl)
      .filter((url): url is string => Boolean(url) && !newPhotoUrls.has(url));

    // Bulk create winners inside transaction
    await db.$transaction(async (tx) => {
      // First clean existing winners to support full overrides cleanly
      await tx.eventWinner.deleteMany({ where: { eventId } });

      const winnersData = winners.map((w: any) => ({
        eventId,
        participantName: w.participantName,
        position: w.position as WinnerPosition,
        prize: w.prize || null,
        description: w.description || null,
        photoUrl: w.photoUrl || null,
      }));

      await tx.eventWinner.createMany({
        data: winnersData,
      });
    });

    if (photosToDelete.length > 0) {
      const { deleteImageByUrl } = await import('@/lib/cloudinary');
      await Promise.allSettled(photosToDelete.map((u) => deleteImageByUrl(u)));
    }

    // Notify all registered participants
    const registrations = await db.eventRegistration.findMany({
      where: { eventId },
      select: { userId: true },
    });

    if (registrations.length > 0) {
      const { createNotification } = await import('@/lib/notifications');
      for (const reg of registrations) {
        await createNotification(
          reg.userId,
          'EVENT_WINNER_ANNOUNCED',
          session.user.id,
          'EVENT',
          eventId,
          `Winners announced for event: ${event.title}`
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Record contest winners error:', error);
    return NextResponse.json(
      { error: 'Failed to record event winners list' },
      { status: 500 }
    );
  }
}
