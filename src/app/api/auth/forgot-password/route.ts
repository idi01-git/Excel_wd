import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOtpCode, sendPasswordResetEmail } from '@/lib/otp';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.email || body.username || '').toLowerCase().trim();

    if (!identifier) {
      return NextResponse.json(
        { error: 'Please enter your registered email address or username.' },
        { status: 400 }
      );
    }

    // Lookup user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      },
    });

    if (!user || !user.email) {
      // Return ambiguous success for security to prevent user enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email or username, a verification code has been sent.',
      });
    }

    const cleanEmail = user.email.toLowerCase().trim();

    // Check rate limit on EmailOtp for this email
    const recentRequests: any[] = await db.$queryRawUnsafe(
      `SELECT * FROM "EmailOtp" WHERE "email" = $1 AND "createdAt" > NOW() - INTERVAL '15 minutes' ORDER BY "createdAt" DESC`,
      cleanEmail
    );

    if (recentRequests && recentRequests.length >= 5) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    // Enforce 45-second cooldown
    if (recentRequests && recentRequests.length > 0) {
      const latest = new Date(recentRequests[0].createdAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - latest) / 1000);
      if (elapsedSeconds < 45) {
        return NextResponse.json(
          { error: `Please wait ${45 - elapsedSeconds}s before requesting a new code.` },
          { status: 429 }
        );
      }
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Clear existing active codes for this email
    await db.$executeRawUnsafe(
      `DELETE FROM "EmailOtp" WHERE "email" = $1`,
      cleanEmail
    );

    // Insert fresh OTP record
    const id = crypto.randomUUID();
    await db.$executeRawUnsafe(
      `INSERT INTO "EmailOtp" ("id", "email", "code", "attempts", "expiresAt", "createdAt") VALUES ($1, $2, $3, 0, $4, NOW())`,
      id,
      cleanEmail,
      code,
      expiresAt
    );

    // Dispatch Password Reset Email
    await sendPasswordResetEmail(cleanEmail, code, user.name);

    // Mask email for client display (e.g. s***g@gmail.com)
    const [local, domain] = cleanEmail.split('@');
    const maskedLocal = local.length > 2
      ? `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}`
      : `${local[0]}*`;
    const maskedEmail = `${maskedLocal}@${domain}`;

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      maskedEmail,
      message: `Verification code sent to ${maskedEmail}`,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
