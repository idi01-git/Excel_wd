import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

const KEYS = ['home.eventsStrip', 'home.testimonials', 'home.heroCards', 'footer.links'] as const;
type Key = (typeof KEYS)[number];

function valid(key: Key, value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (key === 'home.eventsStrip') return Array.isArray(record.items) && record.items.length <= 8;
  if (key === 'home.testimonials') return ['RANDOM', 'CURATED'].includes(String(record.mode)) && Array.isArray(record.pinnedIds) && record.pinnedIds.length <= 4;
  if (key === 'home.heroCards') return Array.isArray(record.cards) && record.cards.length <= 24;
  return Array.isArray(record.groups) && Array.isArray(record.socials);
}

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { error } = await requirePermission('MANAGE_HOMEPAGE_CMS'); if (error) return error;
  const { key } = await params; if (!KEYS.includes(key as Key)) return NextResponse.json({ error: 'Unknown homepage setting' }, { status: 404 });
  return NextResponse.json({ success: true, setting: await db.siteSetting.findUnique({ where: { key } }) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { session, error } = await requirePermission('MANAGE_HOMEPAGE_CMS'); if (error || !session) return error;
  const { key } = await params; if (!KEYS.includes(key as Key)) return NextResponse.json({ error: 'Unknown homepage setting' }, { status: 404 });
  const { value } = await req.json(); if (!valid(key as Key, value)) return NextResponse.json({ error: 'Invalid setting format' }, { status: 400 });
  const setting = await db.siteSetting.upsert({ where: { key }, create: { key, value, updatedBy: session.user.id }, update: { value, updatedBy: session.user.id } });
  await recordAuditEvent({ actorId: session.user.id, action: 'HOMEPAGE_SETTING_UPDATE', entityType: 'SITE_SETTING', entityId: key, metadata: { key }, request: req });
  return NextResponse.json({ success: true, setting });
}