// src/app/api/events/[slug]/gallery/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GalleryItemType } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const typeQuery = searchParams.get('type');

    const event = await db.event.findUnique({
      where: { slug },
      select: { id: true, title: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const whereClause: any = { eventId: event.id };
    if (typeQuery && Object.values(GalleryItemType).includes(typeQuery as GalleryItemType)) {
      whereClause.type = typeQuery as GalleryItemType;
    }

    const items = await db.eventGalleryItem.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, items, event });
  } catch (error: any) {
    console.error('Fetch public event gallery error:', error);
    return NextResponse.json({ error: 'Failed to retrieve event gallery items' }, { status: 500 });
  }
}
