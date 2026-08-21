// src/app/api/admin/roles/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { VerificationStatus } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { error } = await requirePermission('MANAGE_ROLES');
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();

    // Base search filter
    const searchCondition = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { rollNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Fetch pending verification queue
    const pending = await db.user.findMany({
      where: {
        verificationStatus: VerificationStatus.PENDING,
        ...searchCondition,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        verificationStatus: true,
        profilePhoto: true,
        bio: true,
        branch: true,
        batch: true,
        rollNumber: true,
        socialLinks: true,
        memberSection: true,
        memberTitle: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch all users
    const all = await db.user.findMany({
      where: searchCondition,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        verificationStatus: true,
        profilePhoto: true,
        bio: true,
        branch: true,
        batch: true,
        rollNumber: true,
        socialLinks: true,
        memberSection: true,
        memberTitle: true,
        createdAt: true,
        _count: {
          select: { publications: true, comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    return NextResponse.json({
      success: true,
      pending,
      all,
      stats: {
        pendingCount: pending.length,
        totalUsers: await db.user.count(),
      },
    });
  } catch (error: any) {
    console.error('Fetch roles queue error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve roles and verification queue' },
      { status: 500 }
    );
  }
}
