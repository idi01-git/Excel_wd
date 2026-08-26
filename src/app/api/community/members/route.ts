import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    // Fetch official club leaders and society members
    let members: any[] = await db.user.findMany({
      where: {
        OR: [
          { role: { in: OFFICIAL_MEMBER_ROLES } },
          { memberSection: { not: null } },
        ],
        ...(search
          ? {
              AND: [
                {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                  ],
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
        profilePhoto: true,
        bio: true,
        role: true,
        memberSection: true,
        memberTitle: true,
        branch: true,
        batch: true,
        directoryPhoto: true,
        showSocialLinks: true,
        socialLinks: true,
        alumniProfile: {
          select: {
            id: true,
            batch: true,
          },
        },
      },
      orderBy: [{ memberSection: 'asc' }, { name: 'asc' }],
    });

    // Safely query displayOrder from Postgres table
    try {
      const orderRows: any[] = await db.$queryRawUnsafe(`SELECT id, "displayOrder" FROM "User"`);
      const orderMap = new Map(orderRows.map((r) => [r.id, r.displayOrder ?? 0]));
      members = members
        .map((m) => ({
          id: m.id,
          name: m.name,
          username: m.username,
          profilePhoto: m.profilePhoto,
          directoryPhoto: m.directoryPhoto,
          bio: m.bio,
          role: m.role,
          memberSection: m.memberSection,
          memberTitle: m.memberTitle,
          branch: m.branch,
          batch: m.batch,
          displayOrder: orderMap.get(m.id) ?? 0,
          alumniProfile: m.alumniProfile,
          socialLinks: m.showSocialLinks ? m.socialLinks : null,
        }))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    } catch (orderErr) {
      console.warn('displayOrder community augmentation:', orderErr);
    }

    return NextResponse.json(
      { success: true, members },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to retrieve club members' }, { status: 500 });
  }
}