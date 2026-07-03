// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereClause: any = {
      recipientId: session.user.id
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await db.notification.findMany({
      where: whereClause,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Pre-resolve dynamic URLs for each notification
    const resolvedNotifications = await Promise.all(
      notifications.map(async (n) => {
        let targetUrl = '/';

        try {
          if (n.entityType === 'PUBLICATION') {
            const pub = await db.publication.findUnique({
              where: { id: n.entityId },
              select: { slug: true }
            });
            if (pub) {
              targetUrl = `/publications/${pub.slug}`;
            }
          } else if (n.entityType === 'COMMENT') {
            const comment = await db.comment.findUnique({
              where: { id: n.entityId },
              select: {
                publication: { select: { slug: true } },
                editorShelf: { select: { slug: true } }
              }
            });
            if (comment) {
              if (comment.publication) {
                targetUrl = `/publications/${comment.publication.slug}`;
              } else if (comment.editorShelf) {
                targetUrl = `/editors-shelf/${comment.editorShelf.slug}`;
              }
            }
          } else if (n.entityType === 'EDITORS_SHELF') {
            const item = await db.editorShelfItem.findUnique({
              where: { id: n.entityId },
              select: { slug: true }
            });
            if (item) {
              targetUrl = `/editors-shelf/${item.slug}`;
            }
          }
        } catch (err) {
          console.error(`Failed to resolve target url for notification ${n.id}`, err);
        }

        return {
          ...n,
          targetUrl
        };
      })
    );

    return NextResponse.json({ success: true, notifications: resolvedNotifications });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to retrieve notifications' }, { status: 500 });
  }
}
