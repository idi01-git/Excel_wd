// src/app/api/admin/events/[id]/registrations/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || (role !== 'MODERATOR' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Staff access only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const registrations = await db.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true
          }
        }
      },
      orderBy: {
        registeredAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await db.eventRegistration.count({
      where: { eventId }
    });

    return NextResponse.json({
      success: true,
      registrations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Fetch event registrations error:', error);
    return NextResponse.json({ error: 'Failed to retrieve event registrations' }, { status: 500 });
  }
}
