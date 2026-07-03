// src/app/api/admin/events/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || (role !== 'MODERATOR' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Staff access only' }, { status: 403 });
    }

    const {
      title,
      description,
      posterImage,
      date,
      time,
      venue,
      isCompetition,
      maxCapacity
    } = await req.json();

    if (!title || !description || !date || !venue) {
      return NextResponse.json({ error: 'Missing required parameters (title, description, date, venue)' }, { status: 400 });
    }

    // Slug generation
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    // Collision check
    const collision = await db.event.findUnique({
      where: { slug }
    });

    if (collision) {
      slug = `${slugBase}-${Math.random().toString(36).substr(2, 5)}`;
    }

    const parsedCapacity = maxCapacity && parseInt(maxCapacity) > 0 ? parseInt(maxCapacity) : null;

    const event = await db.event.create({
      data: {
        title,
        slug,
        description,
        posterImage: posterImage || null,
        date: new Date(date),
        time: time || null,
        venue,
        isCompetition: !!isCompetition,
        maxCapacity: parsedCapacity
      }
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Failed to create new event' }, { status: 500 });
  }
}
