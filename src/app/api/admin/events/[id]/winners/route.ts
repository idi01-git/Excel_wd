// src/app/api/admin/events/[id]/winners/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { WinnerPosition } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || (role !== 'MODERATOR' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Staff access only' }, { status: 403 });
    }

    const { winners } = await req.json();

    if (!winners || !Array.isArray(winners)) {
      return NextResponse.json({ error: 'Missing winners list data' }, { status: 400 });
    }

    // Verify event exists
    const event = await db.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Bulk create winners inside transaction
    await db.$transaction(async (tx) => {
      // First clean existing winners to support full overrides cleanly
      await tx.eventWinner.deleteMany({ where: { eventId } });

      const winnersData = winners.map((w: any) => ({
        eventId,
        participantName: w.participantName,
        position: w.position as WinnerPosition,
        prize: w.prize || null,
        description: w.description || null
      }));

      await tx.eventWinner.createMany({
        data: winnersData
      });
    });

    // Notify all registered participants
    const registrations = await db.eventRegistration.findMany({
      where: { eventId },
      select: { userId: true }
    });

    if (registrations.length > 0) {
      const { createNotification } = await import('@/lib/notifications');
      for (const reg of registrations) {
        await createNotification(
          reg.userId,
          'EVENT_WINNER_ANNOUNCED',
          session.user.id,
          'EVENT',
          eventId
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Record contest winners error:', error);
    return NextResponse.json({ error: 'Failed to record event winners list' }, { status: 500 });
  }
}
