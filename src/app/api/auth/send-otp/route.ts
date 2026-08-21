import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAndSaveOtp } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email is already registered in DB
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address is already registered. Please log in.' },
        { status: 409 }
      );
    }

    // Generate & send OTP
    const result = await createAndSaveOtp(cleanEmail, name || 'Member');

    return NextResponse.json({
      success: true,
      message: 'Verification code dispatched.',
      isDev: result.isDev,
      devCode: result.isDev ? result.code : undefined,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch verification code.' },
      { status: 429 }
    );
  }
}
