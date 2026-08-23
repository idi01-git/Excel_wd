// src/app/api/admin/events/[id]/route.ts
// Handles event detail retrieval, updates, and deletion
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EventStatus } from '@prisma/client';
import { recordAuditEvent } from '@/lib/audit';
import { requirePermission } from '@/lib/api-auth';
import { deleteImageByUrl } from '@/lib/cloudinary';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission('VIEW_ADMIN_EVENTS');
    if (error) return error;

    const { id } = await params;
    const event = await db.event.findUnique({
      where: { id },
      include: {
        registrations: true,
        winners: true,
        report: true,
        gallery: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Fetch event detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event detail' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_EVENTS');
    if (error || !session) return error;

    const { id } = await params;
    const {
      title,
      description,
      posterImage,
      coverImage,
      date,
      time,
      venue,
      isCompetition,
      maxCapacity,
      rulebookUrl,
      socialLink,
      downloadUrl,
      customFormFields,
      googleSheetUrl,
      requirePayment,
      paymentQrImage,
      paymentAmount,
      paymentInstructions,
      internalReportUrl,
      externalReportUrl,
      internalGalleryUrl,
      externalGalleryUrl,
      slug: customSlug,
    } = await req.json();

    if (!title || !description || !date || !venue) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Google Sheet webhook must be a real webhook URL, not a spreadsheet link or typo.
    if (googleSheetUrl && !/^https:\/\/(script\.google\.com|hooks\.[a-z0-9.-]+)\//.test(googleSheetUrl)) {
      return NextResponse.json(
        { error: 'Google Sheet URL must be a webhook (https://script.google.com/... or https://hooks....)' },
        { status: 400 }
      );
    }

    const parsedCapacity =
      maxCapacity && parseInt(maxCapacity) > 0 ? parseInt(maxCapacity) : null;

    const event = await db.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let finalSlug = event.slug;
    if (typeof customSlug === 'string' && customSlug.trim()) {
      // Explicit event code from the admin UI — validate format EXC-YY-MM-xxx
      const cleaned = customSlug.trim().toLowerCase();
      if (!/^exc-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{1,}$/.test(cleaned)) {
        return NextResponse.json(
          { error: 'Event code must look like EXC-YY-MM-your-code (lowercase letters, numbers and hyphens).' },
          { status: 400 }
        );
      }
      if (cleaned !== event.slug) {
        const clash = await db.event.findUnique({ where: { slug: cleaned } });
        if (clash) {
          return NextResponse.json({ error: 'That event code is already in use.' }, { status: 409 });
        }
      }
      finalSlug = cleaned;
    } else if (title !== event.title) {
      const slugBase = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      finalSlug = `${slugBase}-${Date.now().toString().slice(-4)}`;
    }

    const newDate = new Date(date);
    const changes: Array<{ field: string; oldVal?: string; newVal: string }> = [];

    // Check date change
    if (event.date.toISOString().slice(0, 10) !== newDate.toISOString().slice(0, 10)) {
      const oldFormatted = event.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const newFormatted = newDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      changes.push({ field: 'Date', oldVal: oldFormatted, newVal: newFormatted });
    }

    // Check time change
    if ((event.time || '').trim() !== (time || '').trim()) {
      changes.push({ field: 'Time', oldVal: event.time || 'TBA', newVal: time || 'TBA' });
    }

    // Check venue change
    if (event.venue.trim() !== venue.trim()) {
      changes.push({ field: 'Venue / Location', oldVal: event.venue, newVal: venue });
    }

    // Check title change
    if (event.title.trim() !== title.trim()) {
      changes.push({ field: 'Event Title', oldVal: event.title, newVal: title });
    }

    // Delete replaced images from Cloudinary
    const nextPoster = posterImage || null;
    const nextCover = coverImage || null;
    const nextQr = requirePayment ? (paymentQrImage || null) : null;

    if (nextPoster !== event.posterImage && event.posterImage) {
      await deleteImageByUrl(event.posterImage);
    }
    if (nextCover !== event.coverImage && event.coverImage && event.coverImage !== event.posterImage) {
      await deleteImageByUrl(event.coverImage);
    }
    if (nextQr !== event.paymentQrImage && event.paymentQrImage) {
      await deleteImageByUrl(event.paymentQrImage);
    }

    const updated = await db.event.update({
      where: { id },
      data: {
        title,
        slug: finalSlug,
        description,
        posterImage: nextPoster,
        coverImage: nextCover,
        date: newDate,
        time: time || null,
        venue,
        isCompetition: !!isCompetition,
        maxCapacity: parsedCapacity,
        rulebookUrl: rulebookUrl || null,
        socialLink: socialLink || null,
        downloadUrl: downloadUrl || null,
        customFormFields: customFormFields || null,
        googleSheetUrl: googleSheetUrl || null,
        requirePayment: !!requirePayment,
        paymentQrImage: nextQr,
        paymentAmount: requirePayment ? (paymentAmount || null) : null,
        paymentInstructions: requirePayment ? (paymentInstructions || null) : null,
        internalReportUrl: internalReportUrl || null,
        externalReportUrl: externalReportUrl || null,
        internalGalleryUrl: internalGalleryUrl || null,
        externalGalleryUrl: externalGalleryUrl || null,
      },
    });

    // Notify registered participants if critical event logistics changed
    let notifiedCount = 0;
    if (changes.length > 0) {
      const registrations = await db.eventRegistration.findMany({
        where: { eventId: id },
        select: { name: true, email: true, userId: true },
      });

      if (registrations.length > 0) {
        notifiedCount = registrations.length;
        const { sendEventUpdateEmail } = await import('@/lib/mail');
        const { createNotification } = await import('@/lib/notifications');
        const summaryText = changes.map(c => `${c.field}: ${c.newVal}`).join(', ');

        // Fire-and-forget email dispatches to registered participants
        Promise.allSettled(
          registrations.map((reg) =>
            sendEventUpdateEmail({
              to: reg.email,
              recipientName: reg.name || 'Participant',
              eventTitle: updated.title,
              changes,
              event: {
                title: updated.title,
                date: updated.date,
                venue: updated.venue,
                time: updated.time,
                rulebookUrl: updated.rulebookUrl,
              },
            })
          )
        ).catch((err) => console.error('Error broadcasting update emails to participants:', err));

        // Create in-app notifications
        for (const reg of registrations) {
          if (reg.userId) {
            await createNotification(
              reg.userId,
              'EVENT_UPDATE',
              session.user.id,
              'EVENT',
              id,
              `Updates to ${updated.title}: ${summaryText}`
            );
          }
        }
      }
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'EVENT_UPDATE',
      entityType: 'EVENT',
      entityId: id,
      metadata: { title: updated.title, status: updated.status, changes, notifiedCount },
      request: req,
    });
    return NextResponse.json({ success: true, event: updated, notifiedCount, changes });
  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_EVENTS');
    if (error || !session) return error;

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    const eventToDelete = await db.event.findUnique({
      where: { id },
      include: {
        winners: { select: { photoUrl: true } },
        gallery: { select: { url: true } },
        report: { select: { coverImage: true } },
        registrations: { select: { paymentScreenshotUrl: true, id: true } },
      },
    });

    if (!eventToDelete) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const regCount = eventToDelete.registrations.length;

    if (regCount > 0 && !force) {
      return NextResponse.json(
        {
          error:
            'Cannot delete event: active registrations exist. Cancel the event or delete registrations first.',
          code: 'REGISTRATIONS_EXIST',
        },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.eventWinner.deleteMany({ where: { eventId: id } });
      await tx.eventGalleryItem.deleteMany({ where: { eventId: id } });
      await tx.eventReport.deleteMany({ where: { eventId: id } });
      await tx.eventRegistration.deleteMany({ where: { eventId: id } });
      await tx.notification.deleteMany({ where: { eventId: id } });
      await tx.event.delete({ where: { id } });
    });

    // Cleanup all media files from Cloudinary asynchronously
    const urlsToDelete = new Set<string>();
    if (eventToDelete.posterImage) urlsToDelete.add(eventToDelete.posterImage);
    if (eventToDelete.coverImage) urlsToDelete.add(eventToDelete.coverImage);
    if (eventToDelete.paymentQrImage) urlsToDelete.add(eventToDelete.paymentQrImage);
    if (eventToDelete.report?.coverImage) urlsToDelete.add(eventToDelete.report.coverImage);
    eventToDelete.winners.forEach((w) => {
      if (w.photoUrl) urlsToDelete.add(w.photoUrl);
    });
    eventToDelete.gallery.forEach((g) => {
      if (g.url) urlsToDelete.add(g.url);
    });
    eventToDelete.registrations.forEach((r) => {
      if (r.paymentScreenshotUrl) urlsToDelete.add(r.paymentScreenshotUrl);
    });

    await Promise.allSettled(Array.from(urlsToDelete).map((u) => deleteImageByUrl(u)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

