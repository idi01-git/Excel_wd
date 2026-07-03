// src/app/api/community/gallery/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GalleryItemType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeQuery = searchParams.get('type');

    const whereClause: any = {};
    if (typeQuery && Object.values(GalleryItemType).includes(typeQuery as GalleryItemType)) {
      whereClause.type = typeQuery as GalleryItemType;
    }

    const items = await db.galleryItem.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Fetch gallery items error:', error);
    return NextResponse.json({ error: 'Failed to retrieve gallery items' }, { status: 500 });
  }
}
