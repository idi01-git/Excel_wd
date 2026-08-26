import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const { session, error } = await requirePermission('MANAGE_MEMBERS');
    if (error || !session) return error;

    const body = await req.json();
    const { memberIds } = body as { memberIds: string[] };

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'Expected non-empty memberIds array' }, { status: 400 });
    }

    // Atomically update displayOrder directly in PostgreSQL
    await db.$transaction(
      memberIds.map((id, index) =>
        db.$executeRawUnsafe(
          `UPDATE "User" SET "displayOrder" = ${Number(index * 10)} WHERE "id" = '${id.replace(/'/g, "''")}'`
        )
      )
    );

    return NextResponse.json({ success: true, message: 'Members display order updated' });
  } catch (error: any) {
    console.error('Reorder members error:', error);
    return NextResponse.json({ error: 'Failed to update members display order' }, { status: 500 });
  }
}
