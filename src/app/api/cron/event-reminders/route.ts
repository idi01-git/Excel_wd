// src/app/api/cron/event-reminders/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEventReminderEmail } from '@/lib/mail';

/**
 * Daily Cron job to send reminder emails to registered attendees for events happening tomorrow (in 24-48h).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '');

    // Allow cron secret if configured in env
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    // Window: between 20h and 36h from now (~tomorrow)
    const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const upcomingEvents = await db.event.findMany({
      where: {
        status: 'UPCOMING',
        date: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        registrations: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    let totalSent = 0;

    for (const ev of upcomingEvents) {
      const activeRegistrations = ev.registrations.filter(
        (r) => r.paymentStatus !== 'CANCELLED_REFUND_PENDING' && r.paymentStatus !== 'CANCELLED'
      );

      for (const reg of activeRegistrations) {
        const email = reg.email || reg.user.email;
        const name = reg.name || reg.user.name;
        const ticketRef = `${ev.id.substring(0, 6).toUpperCase()}-${reg.id.substring(0, 6).toUpperCase()}`;

        if (email) {
          await sendEventReminderEmail({
            to: email,
            recipientName: name,
            ticketRef,
            event: {
              title: ev.title,
              date: new Date(ev.date),
              venue: ev.venue,
              time: ev.time,
              rulebookUrl: ev.rulebookUrl,
            },
          });
          totalSent++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      eventsChecked: upcomingEvents.length,
      emailsSent: totalSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron event reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to process event reminders' },
      { status: 500 }
    );
  }
}
