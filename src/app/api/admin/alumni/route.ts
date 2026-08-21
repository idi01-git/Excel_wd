import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

function cleanUserId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function validateUserLink(userId: string | null) {
  if (!userId) return null;
  const [user, linkedProfile] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true } }),
    db.alumniProfile.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  if (!user) return 'The selected account no longer exists.';
  if (linkedProfile) return 'That account is already linked to another alumni profile.';
  return null;
}

export async function GET() {
  try {
    const { error } = await requirePermission('MANAGE_ALUMNI');
    if (error) return error;

    const alumni = await db.alumniProfile.findMany({
      include: { user: { select: { id: true, name: true, username: true, role: true } } },
      orderBy: [{ batch: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json({ success: true, alumni });
  } catch (error: unknown) {
    console.error('Admin fetch alumni error:', error);
    return NextResponse.json({ error: 'Failed to retrieve alumni directory' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requirePermission('MANAGE_ALUMNI');
    if (error || !session) return error;
    const body = await req.json();
    const { name, photo, batch, branch, currentPosition, excelsiorPosition, message, instagram, linkedin, email, phone } = body;
    const userId = cleanUserId(body.userId);

    if (!name?.trim() || !batch?.trim() || !branch?.trim()) {
      return NextResponse.json({ error: 'Name, Batch, and Branch are required fields.' }, { status: 400 });
    }
    const linkError = await validateUserLink(userId);
    if (linkError) return NextResponse.json({ error: linkError }, { status: 409 });

    const created = await db.alumniProfile.create({
      data: {
        name: name.trim(), photo: photo?.trim() || null, batch: batch.trim(), branch: branch.trim(),
        currentPosition: currentPosition?.trim() || null, excelsiorPosition: excelsiorPosition?.trim() || null,
        message: message?.trim() || null, instagram: instagram?.trim() || null, linkedin: linkedin?.trim() || null,
        email: email?.trim() || null, phone: phone?.trim() || null, userId,
        showSocialsToTeam: typeof body.showSocialsToTeam === 'boolean' ? body.showSocialsToTeam : true,
      },
      include: { user: { select: { id: true, name: true, username: true, role: true } } },
    });

    await recordAuditEvent({ actorId: session.user.id, action: 'ALUMNI_CREATE', entityType: 'ALUMNI_PROFILE', entityId: created.id, metadata: { name, batch, branch, userId }, request: req });
    return NextResponse.json({ success: true, alumnus: created });
  } catch (error: unknown) {
    console.error('Create alumni error:', error);
    return NextResponse.json({ error: 'Failed to create alumni profile' }, { status: 500 });
  }
}