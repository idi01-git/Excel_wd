// src/app/api/admin/events/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function GET() {
  try {
    const { error } = await requirePermission('VIEW_ADMIN_EVENTS');
    if (error) return error;

    const events = await db.event.findMany({
      orderBy: { date: 'desc' },
      include: {
        _count: {
          select: { registrations: true, winners: true },
        },
      },
    });

    return NextResponse.json({ success: true, events });
  } catch (error: unknown) {
    console.error('List events error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve events' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requirePermission('MANAGE_EVENTS');
    if (error) return error;

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
      slugSuffix,
      requirePayment,
      paymentQrImage,
      paymentAmount,
      paymentInstructions,
    } = await req.json();

    if (!title || !description || !date || !venue) {
      return NextResponse.json(
        { error: 'Missing required parameters (title, description, date, venue)' },
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

    // Slug / event code generation — format: EXC-YY-MM-<code>
    const eventDate = new Date(date);
    const yy = String(eventDate.getFullYear()).slice(-2);
    const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
    const prefix = `exc-${yy}-${mm}-`;

    let slug: string;
    if (typeof slugSuffix === 'string' && slugSuffix.trim()) {
      const suffix = slugSuffix.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, '');
      if (suffix.length < 3) {
        return NextResponse.json(
          { error: 'Event code suffix must be at least 3 characters (letters, numbers, hyphens).' },
          { status: 400 }
        );
      }
      slug = prefix + suffix;
    } else {
      const slugBase = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 40);
      slug = `${prefix}${slugBase || 'event'}`;
    }

    if (await db.event.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const parsedCapacity =
      maxCapacity && parseInt(maxCapacity) > 0 ? parseInt(maxCapacity) : null;
    const event = await db.event.create({
      data: {        title,
        slug,
        description,
        posterImage: posterImage || null,
        coverImage: coverImage || null,
        date: new Date(date),
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
        paymentQrImage: requirePayment ? (paymentQrImage || null) : null,
        paymentAmount: requirePayment ? (paymentAmount || null) : null,
        paymentInstructions: requirePayment ? (paymentInstructions || null) : null,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error: unknown) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Failed to create new event' },
      { status: 500 }
    );
  }
}
