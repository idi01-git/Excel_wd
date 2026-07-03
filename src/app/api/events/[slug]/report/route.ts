// src/app/api/events/[slug]/report/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await db.event.findUnique({
      where: { slug },
      select: { id: true, title: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const report = await db.eventReport.findUnique({
      where: { eventId: event.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found for this event' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report, event });
  } catch (error: any) {
    console.error('Fetch public event report error:', error);
    return NextResponse.json({ error: 'Failed to retrieve event report' }, { status: 500 });
  }
}
