// src/app/api/admin/cms/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const { error } = await requirePermission('MANAGE_HOMEPAGE_CMS');
    if (error) return error;

    const settings = await db.siteSetting.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (error: any) {
    console.error('Fetch CMS settings error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve site configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requirePermission('MANAGE_HOMEPAGE_CMS');
    if (error || !session) return error;

    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const updated = await db.siteSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        updatedBy: session.user.id,
      },
      update: {
        value,
        updatedBy: session.user.id,
      },
    });

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'CMS_SETTING_UPDATE',
      entityType: 'SITE_SETTING',
      entityId: key,
      metadata: { key },
      request: req,
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (error: any) {
    console.error('Save CMS setting error:', error);
    return NextResponse.json(
      { error: 'Failed to update site configuration' },
      { status: 500 }
    );
  }
}
