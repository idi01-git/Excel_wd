// src/app/api/moderator/queue/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';

export async function GET() {
  try {
    const { error } = await requirePermission('MODERATE_PUBLICATIONS');
    if (error) return error;

    const queue = await db.publication.findMany({
      where: {
        status: PublicationStatus.PENDING,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
          },
        },
        alumniProfile: {
          select: {
            id: true,
            name: true,
            batch: true,
            branch: true,
            photo: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'asc', // Oldest pending review first
      },
    });

    return NextResponse.json({ success: true, queue });
  } catch (error: unknown) {
    console.error('Fetch moderation queue error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve moderation queue' },
      { status: 500 }
    );
  }
}
