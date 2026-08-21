import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

function cleanUserId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function validateUserLink(userId: string | null, profileId: string) {
  if (!userId) return null;
  const [user, linkedProfile] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true } }),
    db.alumniProfile.findFirst({ where: { userId, NOT: { id: profileId } }, select: { id: true } }),
  ]);
  if (!user) return 'The selected account no longer exists.';
  if (linkedProfile) return 'That account is already linked to another alumni profile.';
  return null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requirePermission('MANAGE_ALUMNI');
    if (error || !session) return error;
    const { id } = await params;
    const body = await req.json();
    const { name, photo, batch, branch, currentPosition, excelsiorPosition, message, instagram, linkedin, email, phone } = body;
    const userId = body.userId === undefined ? undefined : cleanUserId(body.userId);

    if (userId !== undefined) {
      const linkError = await validateUserLink(userId, id);
      if (linkError) return NextResponse.json({ error: linkError }, { status: 409 });
    }

    const updated = await db.alumniProfile.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        photo: photo !== undefined ? String(photo).trim() || null : undefined,
        batch: batch !== undefined ? String(batch).trim() : undefined,
        branch: branch !== undefined ? String(branch).trim() : undefined,
        currentPosition: currentPosition !== undefined ? String(currentPosition).trim() || null : undefined,
        excelsiorPosition: excelsiorPosition !== undefined ? String(excelsiorPosition).trim() || null : undefined,
        message: message !== undefined ? String(message).trim() || null : undefined,
        instagram: instagram !== undefined ? String(instagram).trim() || null : undefined,
        linkedin: linkedin !== undefined ? String(linkedin).trim() || null : undefined,
        email: email !== undefined ? String(email).trim() || null : undefined,
        phone: phone !== undefined ? String(phone).trim() || null : undefined,
        showSocialsToTeam: body.showSocialsToTeam !== undefined ? Boolean(body.showSocialsToTeam) : undefined,
        userId,
      },
      include: { user: { select: { id: true, name: true, username: true, role: true } } },
    });

    await recordAuditEvent({ actorId: session.user.id, action: 'ALUMNI_UPDATE', entityType: 'ALUMNI_PROFILE', entityId: id, metadata: { name, batch, branch, userId }, request: req });
    return NextResponse.json({ success: true, alumnus: updated });
  } catch (error: unknown) {
    console.error('Update alumni error:', error);
    return NextResponse.json({ error: 'Failed to update alumni profile' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requirePermission('MANAGE_ALUMNI');
    if (error || !session) return error;
    const { id } = await params;
    await db.alumniProfile.delete({ where: { id } });
    await recordAuditEvent({ actorId: session.user.id, action: 'ALUMNI_DELETE', entityType: 'ALUMNI_PROFILE', entityId: id, request: req });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete alumni error:', error);
    return NextResponse.json({ error: 'Failed to delete alumni profile' }, { status: 500 });
  }
}