// src/app/api/editors-shelf/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const items = await db.editorShelfItem.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Fetch editors shelf error:', error);
    return NextResponse.json({ error: 'Failed to retrieve curated list' }, { status: 500 });
  }
}
