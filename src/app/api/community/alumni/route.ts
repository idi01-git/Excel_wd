// src/app/api/community/alumni/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isStaff } from '@/lib/rbac';

export async function GET() {
  try {
    let isCoreCommittee = false; // Coordinator, Tech Lead, PR Head, Operations Head, Treasurer
    let isClubTeam = false;      // Core Committee + Club Members

    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: session.user.id },
          select: { role: true, memberSection: true, isVerified: true, verificationStatus: true },
        });
        if (dbUser) {
          isCoreCommittee = isStaff(dbUser.role) || dbUser.memberSection === 'CORE' || dbUser.memberSection === 'COORDINATORS';
          isClubTeam = isCoreCommittee || dbUser.role === 'MEMBER' || dbUser.role === 'ALUMNI' || dbUser.memberSection !== null || dbUser.isVerified || dbUser.verificationStatus === 'VERIFIED';
        }
      }
    } catch (authError) {
      console.warn('Auth check failed, defaulting to restricted view:', authError);
    }

    const alumni = await db.alumniProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        batch: 'desc',
      },
    });

    const sanitizedAlumni = alumni.map((alum) => {
      const { email, phone, instagram, linkedin, showSocialsToTeam, ...publicData } = alum;

      // 1. Email & Phone: strictly Coordinator and Core Committee only
      const safeEmail = isCoreCommittee ? email : null;
      const safePhone = isCoreCommittee ? phone : null;

      // 2. Instagram & LinkedIn: visible to Core Committee, or Club Team IF showSocialsToTeam is true
      const canSeeSocials = isCoreCommittee || (isClubTeam && showSocialsToTeam);
      const safeInstagram = canSeeSocials ? instagram : null;
      const safeLinkedin = canSeeSocials ? linkedin : null;

      return {
        ...publicData,
        email: safeEmail,
        phone: safePhone,
        instagram: safeInstagram,
        linkedin: safeLinkedin,
        showSocialsToTeam,
        isContactRestricted: !isCoreCommittee && (Boolean(email) || Boolean(phone)),
        isSocialRestricted: !canSeeSocials && (Boolean(instagram) || Boolean(linkedin)),
      };
    });

    return NextResponse.json({ success: true, alumni: sanitizedAlumni });
  } catch (error: any) {
    console.error('Fetch alumni profiles error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve alumni profiles' },
      { status: 500 }
    );
  }
}
