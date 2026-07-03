// src/app/api/events/[slug]/register/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { EventStatus } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventObj = await db.event.findUnique({
      where: { slug }
    });

    if (!eventObj) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventId = eventObj.id;
    const { name, email, phone, extraFields } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing name or email registration data' }, { status: 400 });
    }

    // Run verification inside a Prisma transaction to lock capacity checking safely
    const result = await db.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status !== EventStatus.UPCOMING) {
        throw new Error('Registrations are only open for upcoming events');
      }

      // Check double registration
      const existing = await tx.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: session.user.id
          }
        }
      });

      if (existing) {
        throw new Error('ALREADY_REGISTERED');
      }

      // Capacity check
      if (event.maxCapacity !== null) {
        const count = await tx.eventRegistration.count({
          where: { eventId }
        });
        if (count >= event.maxCapacity) {
          throw new Error('EVENT_FULL');
        }
      }

      // Create registration
      const registration = await tx.eventRegistration.create({
        data: {
          eventId,
          userId: session.user.id,
          name,
          email,
          phone: phone || null,
          extraFields: extraFields || null
        }
      });

      return { success: true, registration };
    });

    // Dispatch confirmation notification
    const { createNotification } = await import('@/lib/notifications');
    await createNotification(
      session.user.id,
      'EVENT_REGISTRATION_CONFIRMED',
      null, // System notification
      'EVENT',
      eventId
    );

    return NextResponse.json({ success: true, registration: result.registration });
  } catch (error: any) {
    console.error('Register event error:', error);
    if (error.message === 'Event not found') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (error.message === 'ALREADY_REGISTERED') {
      return NextResponse.json({ error: 'You are already registered for this event' }, { status: 409 });
    }
    if (error.message === 'EVENT_FULL') {
      return NextResponse.json({ error: 'This event is fully booked' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to register for event' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventObj = await db.event.findUnique({
      where: { slug }
    });

    if (!eventObj) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventId = eventObj.id;

    // Cancellation check: event has not passed
    if (new Date(eventObj.date) < new Date()) {
      return NextResponse.json({ error: 'Cannot cancel registration for past events' }, { status: 400 });
    }

    await db.eventRegistration.delete({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel registration error:', error);
    return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 });
  }
}
