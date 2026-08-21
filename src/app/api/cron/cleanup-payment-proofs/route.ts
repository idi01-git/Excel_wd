// src/app/api/cron/cleanup-payment-proofs/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deleteImageByUrl } from '@/lib/cloudinary';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Daily cron — deletes Cloudinary payment proof assets for registrations verified
 * more than 7 days ago, then nulls the `paymentScreenshotUrl` column.
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

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    // Find all registrations that:
    //  - have a proof URL still stored
    //  - were verified more than 7 days ago
    const staleProofs = await db.eventRegistration.findMany({
      where: {
        paymentScreenshotUrl: { not: null },
        paymentVerifiedAt: { lte: cutoff },
      },
      select: {
        id: true,
        paymentScreenshotUrl: true,
      },
    });

    let deleted = 0;
    let errors = 0;

    for (const reg of staleProofs) {
      if (!reg.paymentScreenshotUrl) continue;

      const { ok } = await deleteImageByUrl(reg.paymentScreenshotUrl);

      // Always null the URL in DB regardless of Cloudinary result —
      // a not-found asset on Cloudinary is still "gone" from our perspective.
      await db.eventRegistration.update({
        where: { id: reg.id },
        data: { paymentScreenshotUrl: null },
      });

      if (ok) {
        deleted++;
      } else {
        errors++;
        console.warn(`Cloudinary delete failed for registration ${reg.id}, URL nulled in DB anyway.`);
      }
    }

    return NextResponse.json({
      success: true,
      proofsCleaned: deleted,
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
