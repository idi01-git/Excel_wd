// src/app/api/admin/events/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { EventStatus } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || (role !== 'MODERATOR' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Staff access only' }, { status: 403 });
    }

    const { action } = await req.json();

    if (action !== 'ARCHIVE' && action !== 'CANCEL') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const event = await db.event.findUnique({
      where: { id }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const newStatus = action === 'ARCHIVE' ? EventStatus.PAST : EventStatus.CANCELLED;

    const updated = await db.event.update({
      where: { id },
      data: { status: newStatus }
    });

    // Notify all registered users
    const registrations = await db.eventRegistration.findMany({
      where: { eventId: id },
      select: { userId: true }
    });

    if (registrations.length > 0) {
      const { createNotification } = await import('@/lib/notifications');
      for (const reg of registrations) {
        await createNotification(
          reg.userId,
          'EVENT_UPDATE',
          session.user.id,
          'EVENT',
          id
        );
      }
    }

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error('Update event status error:', error);
    return NextResponse.json({ error: 'Failed to update event status' }, { status: 500 });
  }
}
