import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MemberSection, Role } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

import { deleteImageByUrl } from '@/lib/cloudinary';

const STAFF_ROLES = [
  Role.COORDINATOR,
  Role.TECH_LEAD,
  Role.PR_HEAD,
  Role.OPERATIONS_HEAD,
  Role.TREASURER,
];

async function updateMember(req: Request, id: string, actorId: string) {
  const body = await req.json();
  const { memberSection, memberTitle, branch, batch, directoryPhoto, showSocialLinks, displayOrder } = body;

  if (memberSection !== undefined && !Object.values(MemberSection).includes(memberSection as MemberSection)) {
    return NextResponse.json({ error: 'Invalid member section' }, { status: 400 });
  }

  const title = memberTitle === undefined ? undefined : String(memberTitle).trim();
  if (title && title.length > 60) {
    return NextResponse.json({ error: 'Member title must be 60 characters or fewer' }, { status: 400 });
  }

  const existing = await db.user.findUnique({
    where: { id },
    select: { directoryPhoto: true },
  });

  const nextPhoto = directoryPhoto === undefined ? undefined : (directoryPhoto ? String(directoryPhoto).trim() : null);

  if (nextPhoto !== undefined && nextPhoto !== existing?.directoryPhoto && existing?.directoryPhoto) {
    await deleteImageByUrl(existing.directoryPhoto);
  }

  const parsedOrder = displayOrder !== undefined ? (Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0) : undefined;

  let updated: any;
  try {
    updated = await db.user.update({
      where: { id },
      data: {
        memberSection: memberSection === undefined ? undefined : memberSection as MemberSection,
        memberTitle: title === undefined ? undefined : title || null,
        branch: branch === undefined ? undefined : String(branch).trim() || null,
        batch: batch === undefined ? undefined : String(batch).trim() || null,
        directoryPhoto: nextPhoto,
        showSocialLinks: showSocialLinks === undefined ? undefined : Boolean(showSocialLinks),
        // @ts-ignore
        displayOrder: parsedOrder,
      },
    });
  } catch {
    updated = await db.user.update({
      where: { id },
      data: {
        memberSection: memberSection === undefined ? undefined : memberSection as MemberSection,
        memberTitle: title === undefined ? undefined : title || null,
        branch: branch === undefined ? undefined : String(branch).trim() || null,
        batch: batch === undefined ? undefined : String(batch).trim() || null,
        directoryPhoto: nextPhoto,
        showSocialLinks: showSocialLinks === undefined ? undefined : Boolean(showSocialLinks),
      },
    });
    if (parsedOrder !== undefined) {
      await db.$executeRawUnsafe(`UPDATE "User" SET "displayOrder" = $1 WHERE "id" = $2`, parsedOrder, id);
    }
  }

  await recordAuditEvent({
    actorId,
    action: 'MEMBER_UPDATE',
    entityType: 'USER',
    entityId: id,
    metadata: { memberSection, memberTitle: title, branch, batch, directoryPhoto: nextPhoto, showSocialLinks, displayOrder: parsedOrder },
    request: req,
  });

  return NextResponse.json({ success: true, member: updated });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requirePermission('MANAGE_MEMBERS');
    if (error || !session) return error;
    const { id } = await params;
    return await updateMember(req, id, session.user.id);
  } catch (error: unknown) {
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member profile' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requirePermission('MANAGE_MEMBERS');
    if (error || !session) return error;
    const { id } = await params;
    const target = await db.user.findUnique({ where: { id }, select: { role: true } });

    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if ((STAFF_ROLES as readonly Role[]).includes(target.role)) {
      return NextResponse.json({ error: 'Staff roles can only be changed in the Roles area.' }, { status: 403 });
    }

    const updated = await db.user.update({
      where: { id },
      data: { role: Role.VISITOR, memberSection: null, memberTitle: null },
    });

    await recordAuditEvent({
      actorId: session.user.id,
      action: 'MEMBER_REMOVE',
      entityType: 'USER',
      entityId: id,
      request: req,
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: unknown) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}