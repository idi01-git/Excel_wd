// src/app/api/admin/events/[id]/send-reminder/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { sendEventReminderEmail } from '@/lib/mail';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_EVENTS');
    if (error || !session) return error;

    const { id: eventId } = await params;
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Filter active attendees
    const activeRegistrations = event.registrations.filter(
      (r) => r.paymentStatus !== 'CANCELLED_REFUND_PENDING' && r.paymentStatus !== 'CANCELLED'
    );

    let sentCount = 0;
    const { createNotification } = await import('@/lib/notifications');

    for (const reg of activeRegistrations) {
      const email = reg.email || reg.user.email;
      const name = reg.name || reg.user.name;
      const ticketRef = `${event.id.substring(0, 6).toUpperCase()}-${reg.id.substring(0, 6).toUpperCase()}`;

      if (email) {
        await sendEventReminderEmail({
          to: email,
          recipientName: name,
          ticketRef,
          event: {
            title: event.title,
            date: new Date(event.date),
            venue: event.venue,
            time: event.time,
            rulebookUrl: event.rulebookUrl,
          },
        });
        sentCount++;
      }

      // Internal app notification
      try {
        await createNotification(
          reg.userId,
          'EVENT_UPDATE',
          session.user.id,
          'EVENT',
          eventId,
          `⏰ Reminder: "${event.title}" is happening tomorrow at ${event.venue}! (${event.time || ''})`
        );
      } catch (notifErr) {
        console.warn('Failed internal notification:', notifErr);
      }
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'EVENT_REMINDER_DISPATCH',
      entityType: 'EVENT',
      entityId: eventId,
      metadata: { sentCount },
      request: req,
    });

    return NextResponse.json({
      success: true,
      sentCount,
      totalAttendees: activeRegistrations.length,
      message: `24-Hour Reminder emails dispatched to ${sentCount} participant${sentCount > 1 ? 's' : ''}.`,
    });
  } catch (error: any) {
    console.error('Send reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch reminder emails' },
      { status: 500 }
    );
  }
}
