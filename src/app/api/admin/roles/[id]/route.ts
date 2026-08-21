// src/app/api/admin/roles/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma, Role, VerificationStatus, MemberSection } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';
import { recordAuditEvent } from '@/lib/audit';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requirePermission('MANAGE_ROLES');
    if (error || !session) return error;

    const { id } = await params;
    const {
      role,
      verificationStatus,
      memberSection,
      memberTitle,
      rejectionReason,
    } = await req.json();

    const targetUser = await db.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const requestedRole =
      verificationStatus === VerificationStatus.REJECTED
        ? Role.VISITOR
        : role && Object.values(Role).includes(role as Role)
          ? (role as Role)
          : targetUser.role;

    // Last Coordinator Demotion Guard. Rejection also demotes to VISITOR.
    if (targetUser.role === Role.COORDINATOR && requestedRole !== Role.COORDINATOR) {
      const coordinatorCount = await db.user.count({
        where: { role: Role.COORDINATOR },
      });

      if (coordinatorCount <= 1) {
        return NextResponse.json(
          {
            error:
              'Cannot demote the last remaining Coordinator. Promote another user to Coordinator first.',
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = {};

    if (role && Object.values(Role).includes(role as Role)) {
      updateData.role = role as Role;
    }

    if (
      verificationStatus &&
      Object.values(VerificationStatus).includes(
        verificationStatus as VerificationStatus
      )
    ) {
      updateData.verificationStatus = verificationStatus as VerificationStatus;
      updateData.isVerified = verificationStatus === VerificationStatus.VERIFIED;

      // If rejected, downgrade to VISITOR
      if (verificationStatus === VerificationStatus.REJECTED) {
        updateData.role = Role.VISITOR;
      }
    }

    if (memberSection !== undefined) {
      updateData.memberSection =
        memberSection &&
        Object.values(MemberSection).includes(memberSection as MemberSection)
          ? (memberSection as MemberSection)
          : null;
    }

    if (memberTitle !== undefined) {
      updateData.memberTitle = memberTitle ? String(memberTitle).trim() : null;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    // Notifications
    const { createNotification } = await import('@/lib/notifications');
    if (verificationStatus === VerificationStatus.VERIFIED) {
      await createNotification(
        id,
        'ACCOUNT_VERIFIED',
        session.user.id,
        'USER',
        id,
        `Congratulations! Your Excelsior profile has been verified as ${updatedUser.role}.`
      );
    } else if (verificationStatus === VerificationStatus.REJECTED) {
      await createNotification(
        id,
        'ACCOUNT_REJECTED',
        session.user.id,
        'USER',
        id,
        rejectionReason ||
          'Your membership verification request could not be matched with society records.'
      );
    } else if (role && role !== targetUser.role) {
      await createNotification(
        id,
        'ROLE_CHANGED',
        session.user.id,
        'USER',
        id,
        `Your society role has been updated to ${role}.`
      );
    }

    // Record Audit Log
    await recordAuditEvent({
      actorId: session.user.id,
      action: 'ROLE_UPDATE',
      entityType: 'USER',
      entityId: id,
      metadata: {
        previousRole: targetUser.role,
        newRole: updatedUser.role,
        previousStatus: targetUser.verificationStatus,
        newStatus: updatedUser.verificationStatus,
      },
      request: req,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    console.error('Update user role/status error:', error);
    return NextResponse.json(
      { error: 'Failed to update user role or status' },
      { status: 500 }
    );
  }
}
