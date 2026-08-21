// src/app/api/admin/editors-shelf/sync-standard/route.ts
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { ensureSeededShelf } from '@/lib/editors-shelf-helper';

export async function POST() {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    await ensureSeededShelf(true);

    return NextResponse.json({
      success: true,
      message: 'All standard 12 reference books synced successfully.',
    });
  } catch (error: any) {
    console.error('Sync standard shelf books error:', error);
    return NextResponse.json(
      { error: 'Failed to sync standard books' },
      { status: 500 }
    );
  }
}
