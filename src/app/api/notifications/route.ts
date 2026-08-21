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

    const resolvedNotifications = await Promise.all(
      notifications.map(async (n) => {
        let targetUrl = '/';
        let entityName: string | undefined = undefined;
        let bookTitle: string | undefined = undefined;

        try {
          if (n.entityType === 'BOOK') {
            const book = await db.book.findUnique({
              where: { id: n.entityId },
              select: { title: true }
            });
            if (book) {
              targetUrl = `/library`;
              bookTitle = book.title;
              entityName = book.title;
            }
          } else if (n.entityType === 'ISSUE_REQUEST') {
            const req = await db.issueRequest.findUnique({
              where: { id: n.entityId },
              include: { book: { select: { title: true } } }
            });
            if (req?.book) {
              targetUrl = `/library`;
              bookTitle = req.book.title;
              entityName = req.book.title;
            }
          } else if (n.entityType === 'PUBLICATION') {
            const pub = await db.publication.findUnique({
              where: { id: n.entityId },
              select: { slug: true, title: true }
            });
            if (pub) {
              if (n.type === 'SUBMISSION_REJECTED') {
                targetUrl = `/workspace`;
              } else {
                targetUrl = `/publications/${pub.slug}`;
              }
              entityName = pub.title;
            }
          } else if (n.entityType === 'COMMENT') {
            const comment = await db.comment.findUnique({
              where: { id: n.entityId },
              select: {
                publication: { select: { slug: true, title: true } },
                editorShelf: { select: { slug: true, title: true } }
              }
            });
            if (comment) {
              if (comment.publication) {
                targetUrl = `/publications/${comment.publication.slug}`;
                entityName = comment.publication.title;
              } else if (comment.editorShelf) {
                targetUrl = `/editors-shelf/${comment.editorShelf.slug}`;
                entityName = comment.editorShelf.title;
              }
            }
          } else if (n.entityType === 'EDITORS_SHELF') {
            const item = await db.editorShelfItem.findUnique({
              where: { id: n.entityId },
              select: { slug: true, title: true }
            });
            if (item) {
              targetUrl = `/editors-shelf/${item.slug}`;
              entityName = item.title;
            }
          } else if (n.entityType === 'EVENT') {
            const event = await db.event.findUnique({
              where: { id: n.entityId },
              select: { slug: true, title: true }
            });
            if (event) {
              targetUrl = `/events/${event.slug}`;
              entityName = event.title;
            }
          } else if (n.entityType === 'EVENT_REGISTRATION') {
            const reg = await db.eventRegistration.findUnique({
              where: { id: n.entityId },
              include: { event: { select: { slug: true, title: true } } }
            });
            if (reg?.event) {
              targetUrl = `/events/${reg.event.slug}/ticket`;
              entityName = reg.event.title;
            }
          } else if (n.entityType === 'USER' || n.entityType === 'ACCOUNT') {
            if (n.type === 'ACCOUNT_VERIFICATION_REQUEST') {
              targetUrl = `/admin/roles`;
            } else {
              const recipientUser = await db.user.findUnique({
                where: { id: n.recipientId },
                select: { username: true, name: true }
              });
              if (recipientUser) {
                targetUrl = `/profile/${recipientUser.username}`;
                entityName = recipientUser.name;
              } else {
                targetUrl = `/`;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to resolve target url for notification ${n.id}`, err);
        }

        return {
          ...n,
          targetUrl,
          bookTitle,
          entityName
        };
      })
    );

    return NextResponse.json({ success: true, notifications: resolvedNotifications });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to retrieve notifications' }, { status: 500 });
  }
}
