// src/app/api/admin/events/[id]/report/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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

    const { title, content, coverImage } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing report title or body content' }, { status: 400 });
    }

    // Verify event exists
    const event = await db.event.findUnique({
      where: { id: eventId }
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
        authorId: session.user.id
      },
      create: {
        eventId,
        title,
        content,
        coverImage: coverImage || null,
        authorId: session.user.id
      }
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Upsert event report error:', error);
    return NextResponse.json({ error: 'Failed to record post-event report' }, { status: 500 });
  }
}
