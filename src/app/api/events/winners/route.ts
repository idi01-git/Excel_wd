// src/app/api/events/winners/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventSlug = searchParams.get('eventSlug');
    const yearQuery = searchParams.get('year');

    const whereClause: any = {};

    if (eventSlug) {
      whereClause.event = { slug: eventSlug };
    }

    if (yearQuery) {
      const year = parseInt(yearQuery);
      if (!isNaN(year)) {
        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
        whereClause.event = {
          ...(whereClause.event || {}),
          date: {
            gte: startOfYear,
            lte: endOfYear
          }
        };
      }
    }

    const winners = await db.eventWinner.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            title: true,
            slug: true,
            date: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, winners });
  } catch (error: any) {
    console.error('Fetch public winners error:', error);
    return NextResponse.json({ error: 'Failed to retrieve winners list' }, { status: 500 });
  }
}
