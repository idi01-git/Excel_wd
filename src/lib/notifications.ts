// src/lib/notifications.ts
import { db } from './db';
import { NotificationType } from '@prisma/client';

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  actorId: string | null,
  entityType: string,
  entityId: string,
  message?: string | null
) {
  try {
    // Self-notification prevention: don't notify a user about their own actions
    if (actorId && recipientId === actorId) {
      return null;
    }

    // Deduplication check: if a notification with these exact details exists, skip creation
    const existing = await db.notification.findFirst({
      where: {
        recipientId,
        type,
        actorId,
        entityType,
        entityId
      }
    });

    if (existing) {
      return existing;
    }

    // Create the new notification
    const notification = await db.notification.create({
      data: {
        recipientId,
        type,
        actorId,
        entityType,
        entityId,
        message
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
