// src/app/api/editors-shelf/[slug]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const item = await db.editorShelfItem.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ error: 'Curated item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Fetch shelf item detail error:', error);
    return NextResponse.json({ error: 'Failed to retrieve curated details' }, { status: 500 });
  }
}
