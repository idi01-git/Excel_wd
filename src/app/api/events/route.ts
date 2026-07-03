// src/app/api/events/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EventStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusQuery = searchParams.get('status') || 'upcoming';

    let status: EventStatus = EventStatus.UPCOMING;
    let orderBy: any = { date: 'asc' }; // Closest first for upcoming

    if (statusQuery.toLowerCase() === 'past') {
      status = EventStatus.PAST;
      orderBy = { date: 'desc' }; // Most recent first for past
    } else if (statusQuery.toLowerCase() === 'cancelled') {
      status = EventStatus.CANCELLED;
      orderBy = { date: 'desc' };
    }

    const events = await db.event.findMany({
      where: { status },
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      },
      orderBy
    });

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('Fetch public events error:', error);
    return NextResponse.json({ error: 'Failed to retrieve events' }, { status: 500 });
  }
}
