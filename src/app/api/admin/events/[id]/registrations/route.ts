// src/app/api/admin/events/[id]/registrations/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission('VIEW_ADMIN_EVENTS');
    if (error) return error;

    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    const registrations = await db.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await db.eventRegistration.count({
      where: { eventId },
    });

    return NextResponse.json({
      success: true,
      registrations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch event registrations error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve event registrations' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('EDIT_REGISTRATIONS');
    if (error || !session) return error;

    const { id: eventId } = await params;
    const body = await req.json();
    const { registrationId, paymentStatus, name, email, phone, extraFields } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: 'registrationId is required' },
        { status: 400 }
      );
    }

    const registration = await db.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true, user: { select: { id: true, name: true, email: true } } },
    });

    if (!registration || registration.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Registration not found for this event' },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {};

    // 1. Payment status update
    if (paymentStatus) {
      if (!['VERIFIED', 'FAILED', 'PENDING', 'REFUNDED', 'CANCELLED_REFUND_PENDING'].includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'Invalid paymentStatus value' },
          { status: 400 }
        );
      }
      updateData.paymentStatus = paymentStatus;
      // Stamp verification timestamp so the proof cleanup cron can act after 7 days
      if (paymentStatus === 'VERIFIED') {
        updateData.paymentVerifiedAt = new Date();
      }
    }

    // 2. Participant details update
    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined) updateData.email = String(email).trim();
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (extraFields !== undefined) updateData.extraFields = extraFields;

    const updated = await db.eventRegistration.update({
      where: { id: registrationId },
      data: updateData,
    });

    // Notify registrant if payment status changed
    if (paymentStatus && paymentStatus !== registration.paymentStatus) {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification(
        registration.userId,
        'EVENT_UPDATE',
        session.user.id,
        'EVENT',
        eventId,
        paymentStatus === 'REFUNDED'
          ? `Refund processed for your cancelled registration for: ${registration.event.title}`
          : `Payment status updated to ${paymentStatus} for event: ${registration.event.title}`
      );

      if (paymentStatus === 'VERIFIED') {
        const { sendPaymentConfirmedEmail } = await import('@/lib/mail');
        await sendPaymentConfirmedEmail({
          to: registration.email || registration.user.email,
          recipientName: registration.name || registration.user.name,
          event: registration.event,
        });
      }
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'REGISTRATION_EDIT',
      entityType: 'EVENT_REGISTRATION',
      entityId: registrationId,
      metadata: { eventId, updatedFields: Object.keys(updateData) },
      request: req,
    });

    // After marking REFUNDED, delete the registration row to free the seat
    // and allow the user to re-register if they wish.
    if (paymentStatus === 'REFUNDED') {
      await db.eventRegistration.delete({ where: { id: registrationId } });
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (error: any) {
    console.error('Update registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update registration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('EDIT_REGISTRATIONS');
    if (error || !session) return error;

    const { id: eventId } = await params;
    const { registrationId } = await req.json();

    if (!registrationId) {
      return NextResponse.json(
        { error: 'registrationId is required' },
        { status: 400 }
      );
    }

    await db.eventRegistration.delete({
      where: { id: registrationId },
    });

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'REGISTRATION_DELETE',
      entityType: 'EVENT_REGISTRATION',
      entityId: registrationId,
      metadata: { eventId },
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}
