// src/app/api/admin/library/issue-requests/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { IssueRequestStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusQuery = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (statusQuery && Object.values(IssueRequestStatus).includes(statusQuery as IssueRequestStatus)) {
      whereClause.status = statusQuery as IssueRequestStatus;
    }

    const requests = await db.issueRequest.findMany({
      where: whereClause,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverImage: true
          }
        },
        requester: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        requestDate: 'desc'
      },
      skip,
      take: limit
    });

    const total = await db.issueRequest.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Fetch all loans error:', error);
    return NextResponse.json({ error: 'Failed to retrieve borrow logs' }, { status: 500 });
  }
}
