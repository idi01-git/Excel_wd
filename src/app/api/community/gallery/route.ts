import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GalleryItemType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeQuery = searchParams.get('type');
    const featuredOnly = searchParams.get('featured') === 'true';

    const whereClause: { type?: GalleryItemType; isFeaturedOnHome?: boolean } = {};
    if (typeQuery && Object.values(GalleryItemType).includes(typeQuery as GalleryItemType)) {
      whereClause.type = typeQuery as GalleryItemType;
    }
    if (featuredOnly) whereClause.isFeaturedOnHome = true;

    const items = await db.galleryItem.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    console.error('Fetch gallery items error:', error);
    return NextResponse.json({ error: 'Failed to retrieve gallery items' }, { status: 500 });
  }
}