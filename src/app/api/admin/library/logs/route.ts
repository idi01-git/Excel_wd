import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function GET() {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const books = await db.book.findMany({
      include: {
        issueRequests: {
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
              },
            },
            approver: {
              select: {
                name: true,
              },
            },
            returner: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, books });
  } catch (error: any) {
    console.error('Error fetching library logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library logs', details: error.message },
      { status: 500 }
    );
  }
}
