// src/app/api/admin/events/[id]/report/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_EVENTS');
    if (error || !session) return error;

    const { id: eventId } = await params;
    const { title, content, coverImage } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing report title or body content' },
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

    // Upsert Event Report
    const report = await db.eventReport.upsert({
      where: { eventId },
      update: {
        title,
        content,
        coverImage: coverImage || null,
        authorId: session.user.id,
      },
      create: {
        eventId,
        title,
        content,
        coverImage: coverImage || null,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Upsert event report error:', error);
    return NextResponse.json(
      { error: 'Failed to record post-event report' },
      { status: 500 }
    );
  }
}
