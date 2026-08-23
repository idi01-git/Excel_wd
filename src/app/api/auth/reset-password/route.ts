import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyOtpCode } from '@/lib/otp';
import * as bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanCode = (code || '').trim();

    if (!cleanEmail || !cleanCode || !newPassword) {
      return NextResponse.json(
        { error: 'Email, verification code, and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 1. Verify OTP code
    const otpResult = await verifyOtpCode(cleanEmail, cleanCode);
    if (!otpResult.valid) {
      return NextResponse.json(
        { error: otpResult.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    // 2. Lookup user
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
    }

    // 3. Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 4. Update user in DB
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // 5. In-app notification
    try {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification(
        user.id,
        'ACCOUNT_VERIFIED',
        null,
        'USER',
        user.id,
        'Your Excelsior account password was successfully updated.'
      );
    } catch (notifErr) {
      console.warn('Failed to dispatch password reset notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You may now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
