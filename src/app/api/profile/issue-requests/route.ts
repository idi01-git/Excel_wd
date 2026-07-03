// src/app/api/profile/issue-requests/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await db.issueRequest.findMany({
      where: {
        requesterId: session.user.id
      },
      include: {
        book: {
          select: {
            title: true,
            author: true,
            coverImage: true
          }
        }
      },
      orderBy: {
        requestDate: 'desc'
      }
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Fetch profile loans error:', error);
    return NextResponse.json({ error: 'Failed to retrieve borrow logs' }, { status: 500 });
  }
}
