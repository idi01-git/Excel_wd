import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow if user is ADMIN or EDITOR (since editors handle the library)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all books with their issue requests, including requester info
    // Ordering by latest updated to show most recently active books first
    const books = await db.book.findMany({
      include: {
        issueRequests: {
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
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
