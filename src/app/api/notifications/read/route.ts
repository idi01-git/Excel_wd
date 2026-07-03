// src/app/api/notifications/read/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.notification.updateMany({
      where: {
        recipientId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mark read notifications error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
