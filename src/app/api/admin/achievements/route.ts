// src/app/api/admin/achievements/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AchievementCategory } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const { error } = await requirePermission('MANAGE_ACHIEVEMENTS');
    if (error) return error;

    const achievements = await db.achievement.findMany({
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ success: true, achievements });
  } catch (error: any) {
    console.error('Admin fetch achievements error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve achievements' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requirePermission('MANAGE_ACHIEVEMENTS');
    if (error || !session) return error;

    const {
      title,
      description,
      category,
      date,
      image,
    } = await req.json();

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Title and Description are required' },
        { status: 400 }
      );
    }

    const created = await db.achievement.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: (category as AchievementCategory) || AchievementCategory.AWARD,
        date: date ? new Date(date) : new Date(),
        image: image?.trim() || null,
      },
    });

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'ACHIEVEMENT_CREATE',
      entityType: 'ACHIEVEMENT',
      entityId: created.id,
      metadata: { title, category },
      request: req,
    });

    return NextResponse.json({ success: true, achievement: created });
  } catch (error: any) {
    console.error('Create achievement error:', error);
    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    );
  }
}
