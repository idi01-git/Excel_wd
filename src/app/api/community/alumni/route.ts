// src/app/api/community/alumni/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const alumni = await db.alumniProfile.findMany({
      orderBy: {
        batch: 'desc'
      }
    });

    return NextResponse.json({ success: true, alumni });
  } catch (error: any) {
    console.error('Fetch alumni profiles error:', error);
    return NextResponse.json({ error: 'Failed to retrieve alumni profiles' }, { status: 500 });
  }
}
