// src/app/api/events/[slug]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    const event = await db.event.findUnique({
      where: { slug },
      omit: { googleSheetUrl: true, googleSheetId: true },
      include: {
        winners: true,
        report: {
          include: {
            author: {
              select: { id: true, name: true, username: true }
            }
          }
        },
        _count: {
          select: {
            registrations: {
              where: {
                NOT: {
                  paymentStatus: { in: ['CANCELLED_REFUND_PENDING', 'CANCELLED', 'REFUNDED'] }
                }
              }
            },
            gallery: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let userRegistered = false;
    let registrationDetails: any = null;

    if (session?.user) {
      const reg = await db.eventRegistration.findFirst({
        where: {
          eventId: event.id,
          userId: session.user.id,
          NOT: {
            paymentStatus: { in: ['CANCELLED', 'REFUNDED'] },
          },
        },
        orderBy: { registeredAt: 'desc' },
      });
      if (reg) {
        userRegistered = true;
        registrationDetails = reg;
      }
    }

    return NextResponse.json({
      success: true,
      event,
      userRegistered,
      registrationDetails
    });
  } catch (error: any) {
    console.error('Fetch event detail error:', error);
    return NextResponse.json({ error: 'Failed to retrieve event details' }, { status: 500 });
  }
}
