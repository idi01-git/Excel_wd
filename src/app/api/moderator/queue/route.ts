// src/app/api/moderator/queue/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    if (!session || (userRole !== 'MODERATOR' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Staff access only' }, { status: 403 });
    }

    const queue = await db.publication.findMany({
      where: {
        status: PublicationStatus.PENDING
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
      orderBy: {
        updatedAt: 'asc' // Oldest pending review first
      }
    });

    return NextResponse.json({ success: true, queue });
  } catch (error: any) {
    console.error('Fetch moderation queue error:', error);
    return NextResponse.json({ error: 'Failed to retrieve moderation queue' }, { status: 500 });
  }
}
