// src/app/api/community/alumni/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    // Try to get session for role-based contact visibility
    let isAuthorized = false;
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth');
      const session = await getServerSession(authOptions);
      const userRole = session?.user?.role;
      isAuthorized = userRole === 'ADMIN' || userRole === 'MODERATOR';
    } catch (authError) {
      console.warn('Auth check failed, defaulting to restricted view:', authError);
    }

    const alumni = await db.alumniProfile.findMany({
      orderBy: {
        batch: 'desc'
      }
    });

    const sanitizedAlumni = alumni.map((alum) => {
      const { instagram, linkedin, email, phone, ...publicData } = alum;
      return {
        ...publicData,
        instagram: isAuthorized ? instagram : null,
        linkedin: isAuthorized ? linkedin : null,
        email: isAuthorized ? email : null,
        phone: isAuthorized ? phone : null,
        isContactRestricted: !isAuthorized
      };
    });

    return NextResponse.json({ success: true, alumni: sanitizedAlumni });
  } catch (error: any) {
    console.error('Fetch alumni profiles error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to retrieve alumni profiles' }, { status: 500 });
  }
}
