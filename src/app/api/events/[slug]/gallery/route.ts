// src/app/api/events/[slug]/gallery/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GalleryItemType, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, isStaff } from '@/lib/rbac';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const typeQuery = searchParams.get('type');

    // Check if the current user is an official Excelsior member/staff
    const isExcelsiorMember = Boolean(
      session?.user &&
      session.user.verificationStatus === 'VERIFIED' &&
      (isStaff(session.user.role) || hasPermission(session.user.role, 'PUBLISH_CONTENT'))
    );

    const event = await db.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        downloadUrl: true,
        socialLink: true,
        posterImage: true,
        coverImage: true,
        status: true,
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const whereClause: Prisma.EventGalleryItemWhereInput = { eventId: event.id };
    if (typeQuery && Object.values(GalleryItemType).includes(typeQuery as GalleryItemType)) {
      whereClause.type = typeQuery as GalleryItemType;
    }

    const allItems = await db.eventGalleryItem.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If user is not an Excelsior member (e.g. alumni or general reader):
    // Show curated public/alumni photos (Posters, Memories, or curated public selection)
    let items = allItems;
    if (!isExcelsiorMember) {
      const publicFiltered = allItems.filter(
        (it) => it.type === GalleryItemType.POSTER || it.type === GalleryItemType.MEMORY || it.caption?.toLowerCase().includes('public')
      );
      // If specific public items exist, use them; otherwise use public subset or all available
      items = publicFiltered.length > 0 ? publicFiltered : allItems;
    }

    // Determine the distinct download drive link
    // Member drive link vs Public / Alumni drive link
    const memberDriveLink = event.downloadUrl || 'https://drive.google.com/drive/folders/excelsior-members-full-archive';
    const publicDriveLink = event.socialLink || 'https://drive.google.com/drive/folders/excelsior-public-highlights-gallery';
    const driveDownloadUrl = isExcelsiorMember ? memberDriveLink : publicDriveLink;

    return NextResponse.json({
      success: true,
      items,
      event,
      isExcelsiorMember,
      driveDownloadUrl,
      memberDriveLink,
      publicDriveLink,
    });
  } catch (error: unknown) {
    console.error('Fetch event gallery error:', error);
    return NextResponse.json({ error: 'Failed to retrieve event gallery items' }, { status: 500 });
  }
}
