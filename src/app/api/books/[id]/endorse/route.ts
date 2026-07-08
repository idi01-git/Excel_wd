import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;

    // We simply increment the endorseCount
    const book = await db.book.update({
      where: { id: resolvedParams.id },
      data: { endorseCount: { increment: 1 } }
    });

    return NextResponse.json({ success: true, count: book.endorseCount });
  } catch (error: any) {
    console.error('Endorse book error:', error);
    return NextResponse.json({ error: 'Failed to endorse book' }, { status: 500 });
  }
}
