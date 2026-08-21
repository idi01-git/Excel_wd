// src/app/api/admin/editors-shelf/reorder/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const { itemIds } = (await req.json()) as { itemIds: string[] };

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { error: 'Expected itemIds array' },
        { status: 400 }
      );
    }

    // Update display orders in transaction
    await db.$transaction(
      itemIds.map((id, index) =>
        db.editorShelfItem.update({
          where: { id },
          data: { displayOrder: index * 10 },
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Display order updated' });
  } catch (error: any) {
    console.error('Reorder shelf items error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder items' },
      { status: 500 }
    );
  }
}
