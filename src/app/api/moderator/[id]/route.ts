// src/app/api/moderator/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    if (!session || (userRole !== 'MODERATOR' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Staff access only' }, { status: 403 });
    }

    const pub = await db.publication.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
            bio: true
          }
        }
      }
    });

    if (!pub) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (pub.status !== PublicationStatus.PENDING) {
      return NextResponse.json({ error: 'Publication is not pending review' }, { status: 400 });
    }

    return NextResponse.json({ success: true, publication: pub });
  } catch (error: any) {
    console.error('Fetch pending publication error:', error);
    return NextResponse.json({ error: 'Failed to fetch publication' }, { status: 500 });
  }
}
