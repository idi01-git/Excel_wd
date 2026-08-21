// src/app/api/admin/achievements/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AchievementCategory } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';
import { deleteImageByUrl } from '@/lib/cloudinary';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_ACHIEVEMENTS');
    if (error || !session) return error;

    const { id } = await params;
    const {
      title,
      description,
      category,
      date,
      image,
    } = await req.json();

    const existing = await db.achievement.findUnique({ where: { id } });

    if (image !== undefined && image !== existing?.image && existing?.image) {
      try {
        await deleteImageByUrl(existing.image);
      } catch (err) {
        console.error('Failed to delete old achievement image from Cloudinary:', err);
      }
    }

    const updated = await db.achievement.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        category: category && Object.values(AchievementCategory).includes(category as AchievementCategory) ? (category as AchievementCategory) : undefined,
        date: date ? new Date(date) : undefined,
        image: image !== undefined ? String(image).trim() || null : undefined,
      },
    });

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'ACHIEVEMENT_UPDATE',
      entityType: 'ACHIEVEMENT',
      entityId: id,
      metadata: { title, category },
      request: req,
    });

    return NextResponse.json({ success: true, achievement: updated });
  } catch (error: any) {
    console.error('Update achievement error:', error);
    return NextResponse.json(
      { error: 'Failed to update achievement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_ACHIEVEMENTS');
    if (error || !session) return error;

    const { id } = await params;

    const existing = await db.achievement.findUnique({ where: { id } });
    if (existing?.image) {
      try {
        await deleteImageByUrl(existing.image);
      } catch (err) {
        console.error('Failed to delete achievement image from Cloudinary:', err);
      }
    }

    await db.achievement.delete({
      where: { id },
    });

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'ACHIEVEMENT_DELETE',
      entityType: 'ACHIEVEMENT',
      entityId: id,
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete achievement error:', error);
    return NextResponse.json(
      { error: 'Failed to delete achievement' },
      { status: 500 }
    );
  }
}
