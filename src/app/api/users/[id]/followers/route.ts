// src/app/api/users/[id]/followers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const followers = await db.follow.findMany({
      where: { followingId: id },
      include: {
        follower: {
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

    const list = followers.map(f => f.follower);
    return NextResponse.json({ success: true, list });
  } catch (error: any) {
    console.error('Fetch followers error:', error);
    return NextResponse.json({ error: 'Failed to retrieve followers' }, { status: 500 });
  }
}
