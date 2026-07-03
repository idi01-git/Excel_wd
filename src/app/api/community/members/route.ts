// src/app/api/community/members/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const whereClause: any = {};
    if (search.trim()) {
      const cleanSearch = search.trim();
      whereClause.OR = [
        { name: { contains: cleanSearch, mode: 'insensitive' } },
        { username: { contains: cleanSearch, mode: 'insensitive' } }
      ];
    }

    const members = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        profilePhoto: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            publications: true,
            followers: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to retrieve club members' }, { status: 500 });
  }
}
