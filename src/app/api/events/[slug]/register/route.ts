// src/app/api/events/[slug]/register/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { EventStatus } from '@prisma/client';
import { parseEventFormConfig } from '@/lib/event-form';

// ─── Validation ───────────────────────────────────────────────────────────────

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(5).max(20).optional().nullable(),
  extraFields: z
    .record(
      z.string(),
      z.union([
        z.string().trim().max(500),
        z.number(),
        z.boolean(),
        z.array(z.string().trim().min(1).max(200)).max(20),
      ])
    )
    .optional()
    .nullable(),
  paymentScreenshotUrl: z.string().trim().url().max(2048).optional().nullable(),
});

type FormFieldDef = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'email';
  required: boolean;
  options?: string[];
};

type AnswerValue = string | number | boolean | string[];

/**
 * Keep only answers that correspond to the event's declared custom fields,
 * enforce requiredness, and coerce to string (multi-selects join with "; ").
 * Prevents junk keys, oversized payloads, and overwrites of core columns
 * (name/email/phone) in the Sheet.
 */
function sanitizeExtraFields(
  fields: FormFieldDef[] | null | undefined,
  answers: Record<string, AnswerValue> | null | undefined
): { ok: true; data: Record<string, string> } | { ok: false; error: string } {
  if (!fields || fields.length === 0) return { ok: true, data: {} };
  const answersObj = answers ?? {};
  const out: Record<string, string> = {};

  const isChoice = (t: FormFieldDef['type']) => t === 'select' || t === 'multiselect';

  for (const field of fields) {
    const value = answersObj[field.id];
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

    if (empty) {
      if (field.required) return { ok: false, error: `Missing answer for "${field.label}"` };
      continue;
    }

    if (field.type === 'checkbox') {
      out[field.id] = value === true || value === 'true' ? 'Yes' : 'No';
    } else if (field.type === 'number') {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) return { ok: false, error: `"${field.label}" must be a number` };
      out[field.id] = String(n);
    } else if (isChoice(field.type)) {
      const selected = Array.isArray(value) ? value : [String(value)];
      if (!field.options?.length) return { ok: false, error: `"${field.label}" has no configured options` };
      const invalid = selected.filter((s) => !field.options!.includes(s));
      if (invalid.length > 0) return { ok: false, error: `Invalid option for "${field.label}": ${invalid.join(', ')}` };
      if (field.type === 'select' && selected.length > 1) {
        return { ok: false, error: `"${field.label}" allows only one option` };
      }
      out[field.id] = selected.join('; ');
    } else {
      // text / textarea / email
      out[field.id] = String(value);
    }
  }

  const declared = new Set(fields.map((f) => f.id));
  const extras = Object.keys(answersObj).filter((k) => !declared.has(k));
  if (extras.length > 0) return { ok: false, error: `Unexpected form data: ${extras.join(', ')}` };

  return { ok: true, data: out };
}

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

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid registration data' },
        { status: 400 }
      );
    }
    const { name, email, phone, extraFields, paymentScreenshotUrl } = parsed.data;

    const eventObj = await db.event.findUnique({
      where: { slug },
    });

    if (!eventObj) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Parse event form config
    const formConfig = parseEventFormConfig(eventObj.customFormFields, eventObj.isCompetition);

    // Check if registrations are on hold
    if (formConfig.isOnHold) {
      return NextResponse.json(
        { error: formConfig.holdReason ? `Registrations are currently on hold: ${formConfig.holdReason}` : 'Registrations for this event are currently on hold.' },
        { status: 400 }
      );
    }

    // Validate standard phone requirement if configured
    if (formConfig.standardFields.phoneRequired && (!phone || !phone.trim())) {
      return NextResponse.json(
        { error: `${formConfig.standardFields.phoneLabel || 'WhatsApp / Phone number'} is required.` },
        { status: 400 }
      );
    }

    // Validate custom-form answers against the event's declared fields
    const sanitized = sanitizeExtraFields(
      formConfig.fields as FormFieldDef[],
      extraFields as Record<string, AnswerValue> | null | undefined
    );
    if (!sanitized.ok) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 });
    }

    const eventId = eventObj.id;

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

      if (event.date.getTime() <= Date.now()) {
        throw new Error('REGISTRATION_CLOSED');
      }

      if (event.requirePayment && !paymentScreenshotUrl) {
        throw new Error('PAYMENT_PROOF_REQUIRED');
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
        const isCancelled = existing.paymentStatus === 'CANCELLED_REFUND_PENDING' || existing.paymentStatus === 'CANCELLED';
        // Allow re-submitting proof while payment is not yet verified or if re-registering after cancellation
        if (isCancelled || (event.requirePayment && existing.paymentStatus !== 'VERIFIED' && paymentScreenshotUrl)) {
          const retry = await tx.eventRegistration.update({
            where: { id: existing.id },
            data: {
              name,
              email,
              phone: phone || null,
              extraFields: sanitized.data,
              paymentScreenshotUrl: paymentScreenshotUrl || existing.paymentScreenshotUrl || null,
              paymentStatus: event.requirePayment ? 'PENDING' : 'VERIFIED',
              registeredAt: new Date(),
            },
          });
          return { success: true, registration: retry, event, retried: true };
        }
        throw new Error('ALREADY_REGISTERED');
      }

      // Capacity check
      if (event.maxCapacity !== null) {
        const count = await tx.eventRegistration.count({
          where: {
            eventId,
            NOT: {
              paymentStatus: { in: ['CANCELLED_REFUND_PENDING', 'CANCELLED', 'REFUNDED'] }
            }
          }
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
          extraFields: sanitized.data,
          paymentScreenshotUrl: paymentScreenshotUrl || null,
        },
      });

      return { success: true, registration, event, retried: false };
    });

    const ticketRef = `EXC-PASS-${eventObj.id.slice(0, 6).toUpperCase()}-${result.registration.id.slice(0, 6).toUpperCase()}`;

    // Async Google Sheets Webhook Dispatch (fire-and-forget — never blocks the response)
    if (result.event?.googleSheetUrl) {
      try {
        const payload = {
          ticketRef,
          eventTitle: eventObj.title,
          name,
          email,
          phone: phone || '',
          ...(sanitized.data as Record<string, string>),
          paymentStatus: result.registration.paymentStatus || (result.event.requirePayment ? 'PENDING' : 'N/A'),
          registeredAt: new Date().toISOString(),
        };
        fetch(result.event.googleSheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((webhookErr) => {
          console.warn('Google Sheet webhook error:', webhookErr);
        });
      } catch (err) {
        console.warn('Google Sheet webhook trigger error:', err);
      }
    }

    // Dispatch confirmation notification (in-app)
    try {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification(
        session.user.id,
        result.retried ? 'EVENT_UPDATE' : 'EVENT_REGISTRATION_CONFIRMED',
        null, // System notification
        'EVENT',
        eventId,
        result.retried
          ? `Registration updated for ${eventObj.title} — payment proof re-submitted for review.`
          : undefined
      );
    } catch (err) {
      console.warn('Registration notification error:', err);
    }

    // Confirmation email — failure must never fail the registration
    try {
      const { sendRegistrationEmail } = await import('@/lib/mail');
      await sendRegistrationEmail({
        to: email,
        recipientName: name,
        ticketRef,
        event: {
          title: eventObj.title,
          date: eventObj.date,
          venue: eventObj.venue,
          time: eventObj.time,
          rulebookUrl: eventObj.rulebookUrl,
        },
        paymentPending: result.event?.requirePayment && result.registration.paymentStatus !== 'VERIFIED',
      });
    } catch (err) {
      console.warn('Registration email dispatch error:', err);
    }

    return NextResponse.json({
      success: true,
      ticketRef,
      retried: result.retried,
      paymentStatus: result.registration.paymentStatus,
    });
  } catch (error: unknown) {
    console.error('Register event error:', error);
    const message = error instanceof Error ? error.message : '';
    if (message === 'Event not found') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (message === 'ALREADY_REGISTERED') {
      return NextResponse.json({ error: 'You are already registered for this event' }, { status: 409 });
    }
    if (message === 'PAYMENT_PROOF_REQUIRED') {
      return NextResponse.json({ error: 'Payment proof is required for this event' }, { status: 400 });
    }
    if (message === 'EVENT_FULL') {
      return NextResponse.json({ error: 'This event is fully booked' }, { status: 409 });
    }
    if (message === 'REGISTRATION_CLOSED') {
      return NextResponse.json({ error: 'Registrations are closed for this event' }, { status: 410 });
    }
    return NextResponse.json({ error: message || 'Failed to register for event' }, { status: 500 });
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

    const existing = await db.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'You are not registered for this event' }, { status: 404 });
    }

    // If the registration involved payment (paid event or proof submitted)
    if (eventObj.requirePayment || existing.paymentScreenshotUrl || existing.paymentStatus === 'VERIFIED') {
      await db.eventRegistration.update({
        where: { id: existing.id },
        data: {
          paymentStatus: 'CANCELLED_REFUND_PENDING',
          extraFields: {
            ...(typeof existing.extraFields === 'object' && existing.extraFields ? (existing.extraFields as Record<string, any>) : {}),
            cancelledAt: new Date().toISOString(),
            cancelledByUserId: session.user.id,
          },
        },
      });

      // Notify Treasurer / Staff about refund action needed
      try {
        const { createNotification } = await import('@/lib/notifications');
        const treasurers = await db.user.findMany({
          where: { role: { in: ['TREASURER', 'COORDINATOR'] } },
          select: { id: true },
        });
        for (const t of treasurers) {
          await createNotification(
            t.id,
            'EVENT_UPDATE',
            session.user.id,
            'EVENT',
            eventId,
            `⚠️ Refund Action Needed: ${existing.name} cancelled registration for paid event "${eventObj.title}". Review payment proof in Attendees tab.`
          );
        }
      } catch (notifErr) {
        console.warn('Refund notification error:', notifErr);
      }

      return NextResponse.json({
        success: true,
        cancelled: true,
        refundPending: true,
        message: 'Registration cancelled. Since entry fees were involved, your cancellation is marked for refund review with our Treasurer.',
      });
    }

    // If free event without payments, delete directly
    await db.eventRegistration.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, cancelled: true });
  } catch (error: unknown) {
    console.error('Cancel registration error:', error);
    return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 });
  }
}
