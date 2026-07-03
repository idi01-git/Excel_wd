// src/app/api/admin/events/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'MODERATOR' && session.user.role !== 'ADMIN')) {
    return null;
  }
  return session.user;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      title,
      description,
      posterImage,
      date,
      time,
      venue,
      isCompetition,
      maxCapacity
    } = await req.json();

    if (!title || !description || !date || !venue) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const parsedCapacity = maxCapacity && parseInt(maxCapacity) > 0 ? parseInt(maxCapacity) : null;

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Slug generation (if title changed)
    let slug = event.slug;
    if (title !== event.title) {
      const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      slug = `${slugBase}-${Date.now().toString().slice(-4)}`;
    }

    const updated = await db.event.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        posterImage: posterImage || null,
        date: new Date(date),
        time: time || null,
        venue,
        isCompetition: !!isCompetition,
        maxCapacity: parsedCapacity
      }
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    // Verify registrations
    const regCount = await db.eventRegistration.count({
      where: { eventId: id }
    });

    if (regCount > 0 && !force) {
      return NextResponse.json({
        error: 'Cannot delete event: active registrations exist. Cancel the event or delete registrations first.',
        code: 'REGISTRATIONS_EXIST'
      }, { status: 400 });
    }

    // Run delete inside transaction
    await db.$transaction(async (tx) => {
      // Delete sub-resources
      await tx.eventWinner.deleteMany({ where: { eventId: id } });
      await tx.eventGalleryItem.deleteMany({ where: { eventId: id } });
      await tx.eventReport.deleteMany({ where: { eventId: id } });
      await tx.eventRegistration.deleteMany({ where: { eventId: id } });
      await tx.notification.deleteMany({ where: { eventId: id } });
      
      // Delete the event
      await tx.event.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
