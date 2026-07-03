// src/app/api/users/[id]/follow/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;
  return session.user;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const followerId = user.id;
    const { id: followingId } = await params;

    // Self-follow prevention
    if (followerId === followingId) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: followingId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create follow record
    await db.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId }
      },
      update: {},
      create: { followerId, followingId }
    });

    return NextResponse.json({ success: true, following: true });
  } catch (error: any) {
    console.error('Follow API error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const followerId = user.id;
    const { id: followingId } = await params;

    // Delete follow record if it exists
    await db.follow.deleteMany({
      where: { followerId, followingId }
    });

    return NextResponse.json({ success: true, following: false });
  } catch (error: any) {
    console.error('Unfollow API error:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
