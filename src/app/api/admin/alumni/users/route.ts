import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { error } = await requirePermission('MANAGE_ALUMNI');
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const profileId = searchParams.get('profileId')?.trim() || '';
    if (query.length < 2) return NextResponse.json({ success: true, users: [] });

    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
        AND: [{ OR: [{ alumniProfile: null }, ...(profileId ? [{ alumniProfile: { is: { id: profileId } } }] : [])] }],
      },
      select: { id: true, name: true, username: true, profilePhoto: true, role: true },
      orderBy: { name: 'asc' },
      take: 8,
    });
    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    console.error('Alumni user lookup error:', error);
    return NextResponse.json({ error: 'Failed to find user accounts' }, { status: 500 });
  }
}