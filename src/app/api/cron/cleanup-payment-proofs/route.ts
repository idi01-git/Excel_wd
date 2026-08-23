// src/app/api/cron/cleanup-payment-proofs/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deleteImageByUrl } from '@/lib/cloudinary';
import { EventStatus } from '@prisma/client';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Daily cron — deletes Cloudinary assets and cleans up sensitive data 14 days
 * after an event is marked as completed (PAST) or 14 days after payment verification.
 *
 * 1. Event Payment QR code image deletion from Cloudinary & database.
 * 2. Attendee Payment screenshots deletion from Cloudinary & nulling URL in DB.
 * 3. Cleaning stale registration data for completed events.
 *
 * Trigger: GET /api/cron/cleanup-payment-proofs?secret=CRON_SECRET
 * (or Authorization: Bearer CRON_SECRET)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '');

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - FOURTEEN_DAYS_MS);
    let qrCodesCleaned = 0;
    let paymentProofsCleaned = 0;
    let registrationsCleaned = 0;
    let errors = 0;

    // ─── 1. Completed Events (status === PAST and completed/date >= 14 days ago) ───
    const completedEvents = await db.event.findMany({
      where: {
        status: EventStatus.PAST,
        OR: [
          { updatedAt: { lte: cutoff } },
          { date: { lte: cutoff } },
        ],
      },
      include: {
        registrations: {
          select: {
            id: true,
            paymentScreenshotUrl: true,
          },
        },
      },
    });

    for (const event of completedEvents) {
      // 1a. Delete Event Payment QR Image from Cloudinary
      if (event.paymentQrImage) {
        const { ok } = await deleteImageByUrl(event.paymentQrImage);
        await db.event.update({
          where: { id: event.id },
          data: {
            paymentQrImage: null,
            paymentInstructions: null,
          },
        });
        if (ok) qrCodesCleaned++;
        else errors++;
      }

      // 1b. Delete attendee payment proofs from Cloudinary and null URL in DB
      for (const reg of event.registrations) {
        if (reg.paymentScreenshotUrl) {
          const { ok } = await deleteImageByUrl(reg.paymentScreenshotUrl);
          if (ok) paymentProofsCleaned++;
          else errors++;
        }

        await db.eventRegistration.update({
          where: { id: reg.id },
          data: {
            paymentScreenshotUrl: null,
          },
        });
        registrationsCleaned++;
      }
    }

    // ─── 2. Stale Verified Payment Proofs older than 14 days (any event) ───
    const staleVerifiedProofs = await db.eventRegistration.findMany({
      where: {
        paymentScreenshotUrl: { not: null },
        paymentVerifiedAt: { lte: cutoff },
      },
      select: {
        id: true,
        paymentScreenshotUrl: true,
      },
    });

    for (const reg of staleVerifiedProofs) {
      if (!reg.paymentScreenshotUrl) continue;
      const { ok } = await deleteImageByUrl(reg.paymentScreenshotUrl);

      await db.eventRegistration.update({
        where: { id: reg.id },
        data: { paymentScreenshotUrl: null },
      });

      if (ok) paymentProofsCleaned++;
      else errors++;
    }

    return NextResponse.json({
      success: true,
      qrCodesCleaned,
      paymentProofsCleaned,
      registrationsCleaned,
      completedEventsCount: completedEvents.length,
      errors,
      cutoffDate: cutoff.toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Cron cleanup-payment-proofs error:', error);
    return NextResponse.json(
      { error: 'Failed to process proof cleanup' },
      { status: 500 }
    );
  }
}
