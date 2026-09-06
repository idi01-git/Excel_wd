import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';
import { deleteImageByUrl } from '@/lib/cloudinary';

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

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === '' || str === 'null' || str === 'undefined' ? null : str;
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

    const existing = await db.alumniProfile.findUnique({
      where: { id },
      select: { photo: true },
    });

    const newPhoto = photo !== undefined ? cleanString(photo) : undefined;

    if (newPhoto !== undefined && newPhoto !== existing?.photo && existing?.photo) {
      await deleteImageByUrl(existing.photo);
    }

    const updated = await db.alumniProfile.update({
      where: { id },
      data: {
        name: name !== undefined ? (cleanString(name) || undefined) : undefined,
        photo: newPhoto,
        batch: batch !== undefined ? (cleanString(batch) || undefined) : undefined,
        branch: branch !== undefined ? (cleanString(branch) || undefined) : undefined,
        currentPosition: currentPosition !== undefined ? cleanString(currentPosition) : undefined,
        excelsiorPosition: excelsiorPosition !== undefined ? cleanString(excelsiorPosition) : undefined,
        message: message !== undefined ? cleanString(message) : undefined,
        instagram: instagram !== undefined ? cleanString(instagram) : undefined,
        linkedin: linkedin !== undefined ? cleanString(linkedin) : undefined,
        email: email !== undefined ? cleanString(email) : undefined,
        phone: phone !== undefined ? cleanString(phone) : undefined,
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

    const existing = await db.alumniProfile.findUnique({
      where: { id },
      select: { photo: true },
    });

    await db.alumniProfile.delete({ where: { id } });

    if (existing?.photo) {
      await deleteImageByUrl(existing.photo);
    }

    await recordAuditEvent({ actorId: session.user.id, action: 'ALUMNI_DELETE', entityType: 'ALUMNI_PROFILE', entityId: id, request: req });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete alumni error:', error);
    return NextResponse.json({ error: 'Failed to delete alumni profile' }, { status: 500 });
  }
}