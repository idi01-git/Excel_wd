// src/app/api/community/achievements/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const achievements = await db.achievement.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ success: true, achievements });
  } catch (error: any) {
    console.error('Fetch achievements error:', error);
    return NextResponse.json({ error: 'Failed to retrieve achievements list' }, { status: 500 });
  }
}
