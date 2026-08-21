// src/app/api/admin/gallery/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GalleryItemType } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const { error } = await requirePermission('MANAGE_GALLERY');
    if (error) return error;

    const items = await db.galleryItem.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Admin fetch gallery error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve gallery items' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requirePermission('MANAGE_GALLERY');
    if (error || !session) return error;

    const {
      url,
      type,
      caption,
      eventId,
      isFeaturedOnHome,
    } = await req.json();

    if (!url?.trim()) {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
    }

    const created = await db.galleryItem.create({
      data: {
        url: url.trim(),
        type: (type as GalleryItemType) || GalleryItemType.PHOTO,
        caption: caption?.trim() || null,
        eventId: eventId?.trim() || null,
        isFeaturedOnHome: Boolean(isFeaturedOnHome),
        uploadedById: session.user.id,
      },
    });

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'GALLERY_CREATE',
      entityType: 'GALLERY_ITEM',
      entityId: created.id,
      metadata: { type, isFeaturedOnHome },
      request: req,
    });

    return NextResponse.json({ success: true, item: created });
  } catch (error: any) {
    console.error('Create gallery item error:', error);
    return NextResponse.json(
      { error: 'Failed to create gallery item' },
      { status: 500 }
    );
  }
}
