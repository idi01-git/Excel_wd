// src/app/api/users/[id]/following/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const following = await db.follow.findMany({
      where: { followerId: id },
      include: {
        following: {
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

    const list = following.map(f => f.following);
    return NextResponse.json({ success: true, list });
  } catch (error: any) {
    console.error('Fetch following error:', error);
    return NextResponse.json({ error: 'Failed to retrieve following list' }, { status: 500 });
  }
}
