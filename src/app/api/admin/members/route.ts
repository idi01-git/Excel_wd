import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Role } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const OFFICIAL_MEMBER_ROLES = [
  Role.COORDINATOR,
  Role.TECH_LEAD,
  Role.CONTENT_LEAD,
  Role.PR_HEAD,
  Role.OPERATIONS_HEAD,
  Role.TREASURER,
  Role.MEMBER,
  Role.ALUMNI,
];

export async function GET() {
  try {
    const { error } = await requirePermission('MANAGE_MEMBERS');
    if (error) return error;

    let members: any[] = await db.user.findMany({
      where: {
        OR: [
          { role: { in: OFFICIAL_MEMBER_ROLES } },
          { memberSection: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        memberSection: true,
        memberTitle: true,
        branch: true,
        batch: true,
        rollNumber: true,
        profilePhoto: true,
        directoryPhoto: true,
        bio: true,
        socialLinks: true,
        showSocialLinks: true,
        alumniProfile: { select: { id: true, batch: true } },
        createdAt: true,
      },
      orderBy: [{ memberSection: 'asc' }, { name: 'asc' }],
    });

    // Safely query displayOrder from Postgres table
    try {
      const orderRows: any[] = await db.$queryRawUnsafe(`SELECT id, "displayOrder" FROM "User"`);
      const orderMap = new Map(orderRows.map((r) => [r.id, r.displayOrder ?? 0]));
      members = members
        .map((m) => ({ ...m, displayOrder: orderMap.get(m.id) ?? 0 }))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    } catch (orderErr) {
      console.warn('displayOrder augmentation:', orderErr);
    }

    return NextResponse.json(
      { success: true, members },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Admin members fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve members' }, { status: 500 });
  }
}