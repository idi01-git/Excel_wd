// src/app/api/admin/events/[id]/gallery/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GalleryItemType } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';
import { deleteImageByUrl } from '@/lib/cloudinary';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_EVENTS');
    if (error || !session) return error;

    const { id: eventId } = await params;
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing gallery items list' },
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

    // Bulk creation
    const galleryItemsData = items.map((item: { url: string; caption?: string; type?: string }) => ({
      eventId,
      url: item.url,
      caption: item.caption || null,
      type: (item.type as GalleryItemType) || GalleryItemType.PHOTO,
      uploadedById: session.user.id,
    }));

    const created = await db.eventGalleryItem.createMany({
      data: galleryItemsData,
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error: unknown) {
    console.error('Bulk upload gallery error:', error);
    return NextResponse.json(
      { error: 'Failed to record event gallery items' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission('MANAGE_EVENTS');
    if (error) return error;

    const { id: eventId } = await params;
    const { itemId } = await req.json();

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json({ error: 'Missing gallery itemId' }, { status: 400 });
    }

    const item = await db.eventGalleryItem.findFirst({
      where: { id: itemId, eventId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }

    await db.eventGalleryItem.delete({ where: { id: item.id } });

    // Best-effort Cloudinary cleanup — DB row is already gone.
    await deleteImageByUrl(item.url);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete gallery item error:', error);
    return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 });
  }
}
