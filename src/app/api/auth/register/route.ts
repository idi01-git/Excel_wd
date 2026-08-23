// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { Role, VerificationStatus, MemberSection } from '@prisma/client';
import { registrationSchema } from '@/lib/registration';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || 'Invalid registration data',
          field: parsed.error.issues[0]?.path[0],
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const username = input.username.toLowerCase();
    const email = input.email.toLowerCase();

    // Check if user or email already exists
    const existing = await db.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.username === username
              ? 'This username is already taken.'
              : 'An account with this email address already exists.',
          field: existing.username === username ? 'username' : 'email',
        },
        { status: 409 }
      );
    }

    // Role & Verification Resolution
    let role: Role = Role.VISITOR;
    let verificationStatus: VerificationStatus = VerificationStatus.VERIFIED;
    let memberSection: MemberSection | null = null;
    let memberTitle: string | null = null;
    let linkedProfileId: string | null = null;

    if (input.affiliation === 'ALUMNI') {
      role = Role.ALUMNI;
      memberSection = null; // No special wing / directory section

      const finalBranch = (input.alumniDegree || input.branch || '').trim();
      const finalBatch = (input.alumniBatch || input.batch || '').trim();
      let yearSuffix = '';
      if (finalBatch) {
        const match = finalBatch.match(/(\d{2,4})$/);
        yearSuffix = match ? ` ${match[1].slice(-2)}'` : ` ${finalBatch}`;
      }
      memberTitle = finalBranch ? `${finalBranch}${yearSuffix} Alumnus` : 'Alumnus';

      if (input.linkedAlumniProfileId && input.linkedAlumniProfileId !== 'none') {
        const targetProfile = await db.alumniProfile.findUnique({
          where: { id: input.linkedAlumniProfileId },
        });
        if (targetProfile && !targetProfile.userId) {
          linkedProfileId = targetProfile.id;
          verificationStatus = VerificationStatus.VERIFIED;
        } else {
          verificationStatus = VerificationStatus.PENDING;
        }
      } else {
        // Check fallback match by email or name if not explicitly selected
        const matchingAlumni = await db.alumniProfile.findFirst({
          where: {
            userId: null,
            OR: [
              { email: { equals: email, mode: 'insensitive' } },
              { name: { equals: input.name, mode: 'insensitive' } },
            ],
          },
        });

        if (matchingAlumni) {
          linkedProfileId = matchingAlumni.id;
          verificationStatus = VerificationStatus.VERIFIED;
        } else {
          verificationStatus = VerificationStatus.PENDING;
        }
      }
    } else if (input.affiliation === 'STUDENT') {
      // Enrolled campus student
      role = Role.VISITOR;
      verificationStatus = VerificationStatus.VERIFIED;
    } else {
      // External Visitor
      role = Role.VISITOR;
      verificationStatus = VerificationStatus.VERIFIED;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const defaultPhoto = `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`;

    const user = await db.user.create({
      data: {
        name: input.name,
        username,
        email,
        passwordHash,
        profilePhoto: input.profilePhoto || defaultPhoto,
        branch: input.branch || input.alumniDegree || null,
        batch: input.batch || input.alumniBatch || null,
        bio: input.bio || null,
        rollNumber: input.rollNumber?.toUpperCase() || null,
        socialLinks: input.socialLinks,
        role,
        verificationStatus,
        isVerified: verificationStatus === VerificationStatus.VERIFIED,
        memberSection,
        memberTitle,
      },
    });

    if (linkedProfileId) {
      await db.alumniProfile.update({
        where: { id: linkedProfileId },
        data: { userId: user.id },
      });
    }

    // Create Welcome Notification for new user
    const { createNotification } = await import('@/lib/notifications');
    await createNotification(
      user.id,
      'ACCOUNT_VERIFIED',
      null,
      'USER',
      user.id,
      verificationStatus === VerificationStatus.VERIFIED
        ? `Welcome to Excelsior, ${user.name}! Your account registration is confirmed.`
        : `Welcome to Excelsior, ${user.name}! Your alumnus registration has been submitted for verification.`
    );

    // Notify Coordinators if unverified Alumni is pending approval
    if (verificationStatus === VerificationStatus.PENDING) {
      const coordinators = await db.user.findMany({
        where: { role: Role.COORDINATOR },
        select: { id: true },
      });

      if (coordinators.length > 0) {
        await db.notification.createMany({
          data: coordinators.map((coordinator) => ({
            recipientId: coordinator.id,
            actorId: user.id,
            type: 'ACCOUNT_VERIFICATION_REQUEST',
            entityType: 'USER',
            entityId: user.id,
            message: `${user.name} (@${user.username}) registered as an Alumnus and is awaiting verification.`,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      requiresApproval: verificationStatus === VerificationStatus.PENDING,
      role: user.role,
      username: user.username,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}