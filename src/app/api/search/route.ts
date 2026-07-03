// src/app/api/search/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ success: true, publications: [], users: [], alumni: [] });
    }

    const cleanQuery = query.trim();

    // 1. Search Publications
    const publications = await db.publication.findMany({
      where: {
        status: PublicationStatus.PUBLISHED,
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          { tags: { has: cleanQuery } }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true
          }
        }
      },
      take: 8
    });

    // 2. Search Users (Platform Members)
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { username: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        profilePhoto: true,
        role: true,
        bio: true
      },
      take: 8
    });

    // 3. Search Alumni
    const alumni = await db.alumniProfile.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { branch: { contains: cleanQuery, mode: 'insensitive' } },
          { currentPosition: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      },
      take: 8
    });

    return NextResponse.json({
      success: true,
      publications,
      users,
      alumni
    });
  } catch (error: any) {
    console.error('Global search error:', error);
    return NextResponse.json({ error: 'Failed to perform search query' }, { status: 500 });
  }
}
