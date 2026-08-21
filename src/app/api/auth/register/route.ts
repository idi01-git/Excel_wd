// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { Role, VerificationStatus } from '@prisma/client';
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

    // Duplicate Check
    const existingUser = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      return NextResponse.json(
        {
          error: `${field === 'username' ? 'Username' : 'Email'} is already registered`,
          field,
        },
        { status: 409 }
      );
    }

    // Role & Verification Resolution
    let role: Role = Role.VISITOR;
    let verificationStatus: VerificationStatus = VerificationStatus.VERIFIED;
    const memberSection = null;
    const memberTitle = null;

    if (input.affiliation === 'ALUMNI') {
      role = Role.ALUMNI;
      // Check if there is an existing matching AlumniProfile in Archivum Alumnorum
      const matchingAlumni = await db.alumniProfile.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { name: { equals: input.name, mode: 'insensitive' } },
          ],
        },
      });

      if (matchingAlumni) {
        verificationStatus = VerificationStatus.VERIFIED;
      } else {
        verificationStatus = VerificationStatus.PENDING;
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
        bio: input.bio || (input.alumniOrganization ? `${input.alumniDesignation || 'Alumnus'} at ${input.alumniOrganization}` : null),
        rollNumber: input.rollNumber?.toUpperCase() || null,
        socialLinks: input.socialLinks,
        role,
        verificationStatus,
        isVerified: verificationStatus === VerificationStatus.VERIFIED,
        memberSection,
        memberTitle,
      },
    });

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