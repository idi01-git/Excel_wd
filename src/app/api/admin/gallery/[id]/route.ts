// src/app/api/admin/gallery/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GalleryItemType } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';
import { deleteImageByUrl } from '@/lib/cloudinary';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_GALLERY');
    if (error || !session) return error;

    const { id } = await params;
    const {
      url,
      caption,
      type,
      isFeaturedOnHome,
      eventId,
    } = await req.json();

    const existing = await db.galleryItem.findUnique({
      where: { id },
      select: { url: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }

    const nextUrl = url !== undefined ? String(url).trim() || null : undefined;

    const updated = await db.galleryItem.update({
      where: { id },
      data: {
        url: nextUrl || undefined,
        caption: caption !== undefined ? String(caption).trim() || null : undefined,
        type: type && Object.values(GalleryItemType).includes(type as GalleryItemType) ? (type as GalleryItemType) : undefined,
        isFeaturedOnHome: isFeaturedOnHome !== undefined ? Boolean(isFeaturedOnHome) : undefined,
        eventId: eventId !== undefined ? String(eventId).trim() || null : undefined,
      },
    });

    // If image URL changed, delete the old image from Cloudinary
    if (nextUrl && nextUrl !== existing.url) {
      await deleteImageByUrl(existing.url);
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'GALLERY_UPDATE',
      entityType: 'GALLERY_ITEM',
      entityId: id,
      metadata: { isFeaturedOnHome },
      request: req,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Update gallery item error:', error);
    return NextResponse.json(
      { error: 'Failed to update gallery item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_GALLERY');
    if (error || !session) return error;

    const { id } = await params;

    const item = await db.galleryItem.findUnique({ where: { id }, select: { url: true } });
    if (!item) return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });

    await db.galleryItem.delete({ where: { id } });

    if (item.url) {
      await deleteImageByUrl(item.url);
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'GALLERY_DELETE',
      entityType: 'GALLERY_ITEM',
      entityId: id,
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete gallery item error:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery item' },
      { status: 500 }
    );
  }
}

