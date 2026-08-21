// src/app/api/admin/overview/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/api-auth';
import { isStaff } from '@/lib/rbac';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Access denied: Staff role required.' }, { status: 403 });
  }

  try {
    const [
      pendingRolesCount,
      totalUsersCount,
      totalEventsCount,
      upcomingEventsCount,
      totalMembersCount,
      totalLibraryBooksCount,
      pendingBookIssuesCount,
      totalEditorShelfCount,
      totalGalleryCount,
      totalAchievementsCount,
      totalAlumniCount,
      pendingSubmissionsCount,
    ] = await Promise.all([
      db.user.count({ where: { verificationStatus: 'PENDING' } }),
      db.user.count(),
      db.event.count(),
      db.event.count({ where: { status: 'UPCOMING' } }),
      db.user.count({ where: { memberSection: { not: null } } }),
      db.book.count(),
      db.issueRequest.count({ where: { status: 'PENDING' } }),
      db.editorShelfItem.count(),
      db.eventGalleryItem.count(),
      db.achievement.count(),
      db.alumniProfile.count(),
      db.publication.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        pendingRoles: pendingRolesCount,
        totalUsers: totalUsersCount,
        totalEvents: totalEventsCount,
        upcomingEvents: upcomingEventsCount,
        totalMembers: totalMembersCount,
        totalLibraryBooks: totalLibraryBooksCount,
        pendingBookIssues: pendingBookIssuesCount,
        totalEditorShelf: totalEditorShelfCount,
        totalGallery: totalGalleryCount,
        totalAchievements: totalAchievementsCount,
        totalAlumni: totalAlumniCount,
        pendingSubmissions: pendingSubmissionsCount,
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch admin overview stats:', err);
    return NextResponse.json({ error: 'Failed to compute admin statistics.' }, { status: 500 });
  }
}
