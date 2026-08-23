import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const unassigned = await db.alumniProfile.findMany({
      where: {
        userId: null,
      },
      select: {
        id: true,
        name: true,
        batch: true,
        branch: true,
        currentPosition: true,
        excelsiorPosition: true,
      },
      orderBy: [
        { batch: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, alumni: unassigned });
  } catch (error) {
    console.error('Failed to fetch unassigned alumni profiles:', error);
    return NextResponse.json({ success: false, alumni: [] }, { status: 500 });
  }
}
