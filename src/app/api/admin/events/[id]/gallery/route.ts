// src/app/api/admin/events/[id]/gallery/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { GalleryItemType } from '@prisma/client';

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

    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing gallery items list' }, { status: 400 });
    }

    // Verify event exists
    const event = await db.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Bulk creation
    const galleryItemsData = items.map((item: any) => ({
      eventId,
      url: item.url,
      caption: item.caption || null,
      type: item.type || GalleryItemType.PHOTO,
      uploadedById: session.user.id
    }));

    const created = await db.eventGalleryItem.createMany({
      data: galleryItemsData
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error: any) {
    console.error('Bulk upload gallery error:', error);
    return NextResponse.json({ error: 'Failed to record event gallery items' }, { status: 500 });
  }
}
