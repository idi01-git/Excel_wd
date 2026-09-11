// src/app/api/editors-shelf/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeededShelf, itemToBookData } from '@/lib/editors-shelf-helper';

export async function GET() {
  try {
    const items = await db.editorShelfItem.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    });

    const books = items.map(itemToBookData);

    const response = NextResponse.json({ success: true, items: books, rawItems: items });
    response.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=432000, stale-while-revalidate=86400'
    );
    return response;
  } catch (error: any) {
    console.error('Fetch editors shelf error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve curated 3D shelf items' },
      { status: 500 }
    );
  }
}
