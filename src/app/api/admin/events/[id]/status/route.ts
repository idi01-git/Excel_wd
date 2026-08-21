// src/app/api/admin/events/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EventStatus } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_EVENTS');
    if (error || !session) return error;

    const { id } = await params;
    const { action } = await req.json();

    if (action !== 'ARCHIVE' && action !== 'CANCEL' && action !== 'UPCOMING' && action !== 'HOLD' && action !== 'UNHOLD') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const event = await db.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (action === 'HOLD' || action === 'UNHOLD') {
      const { parseEventFormConfig, serializeEventFormConfig } = await import('@/lib/event-form');
      const formConfig = parseEventFormConfig(event.customFormFields, event.isCompetition);
      formConfig.isOnHold = action === 'HOLD';
      const updated = await db.event.update({
        where: { id },
        data: { customFormFields: serializeEventFormConfig(formConfig) },
      });
      return NextResponse.json({ success: true, event: updated });
    }

    let newStatus: EventStatus = EventStatus.UPCOMING;
    if (action === 'ARCHIVE') newStatus = EventStatus.PAST;
    if (action === 'CANCEL') newStatus = EventStatus.CANCELLED;

    const updated = await db.event.update({
      where: { id },
      data: { status: newStatus },
    });

    // Notify all registered users
    const registrations = await db.eventRegistration.findMany({
      where: { eventId: id },
      select: { userId: true },
    });

    if (registrations.length > 0) {
      const { createNotification } = await import('@/lib/notifications');
      for (const reg of registrations) {
        await createNotification(
          reg.userId,
          'EVENT_UPDATE',
          session.user.id,
          'EVENT',
          id,
          `Event status changed to ${newStatus}`
        );
      }
    }

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error('Update event status error:', error);
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
}
