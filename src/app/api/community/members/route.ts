import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';

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

    const members = await db.user.findMany({
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

    const mappedMembers = members.map((m) => ({
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
      alumniProfile: m.alumniProfile,
      socialLinks: m.showSocialLinks ? m.socialLinks : null,
    }));

    return NextResponse.json({ success: true, members: mappedMembers });
  } catch (error: unknown) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to retrieve club members' }, { status: 500 });
  }
}