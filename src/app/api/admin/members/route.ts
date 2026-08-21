import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Role } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';

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

    const members = await db.user.findMany({
      where: {
        OR: [
          { role: { in: OFFICIAL_MEMBER_ROLES } },
          { memberSection: { not: null } },
        ],
      },
      select: {
        id: true, name: true, username: true, email: true, role: true,
        memberSection: true, memberTitle: true, branch: true, batch: true,
        rollNumber: true, profilePhoto: true, directoryPhoto: true, bio: true,
        socialLinks: true, showSocialLinks: true,
        alumniProfile: { select: { id: true, batch: true } },
        createdAt: true,
      },
      orderBy: [{ memberSection: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, members });
  } catch (error: unknown) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to retrieve society members' }, { status: 500 });
  }
}

// Role assignment belongs exclusively to the coordinator-only Roles area.
export async function POST() {
  return NextResponse.json(
    { error: 'Use the Roles area to assign membership roles.' },
    { status: 405 }
  );
}