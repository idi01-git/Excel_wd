// src/app/api/moderator/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission('MODERATE_PUBLICATIONS');
    if (error) return error;

    const { id } = await params;

    const pub = await db.publication.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
            bio: true,
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
    });

    if (!pub) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    if (pub.status !== PublicationStatus.PENDING) {
      return NextResponse.json(
        { error: 'Publication is not pending review' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, publication: pub });
  } catch (error: unknown) {
    console.error('Fetch pending publication error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publication' },
      { status: 500 }
    );
  }
}
