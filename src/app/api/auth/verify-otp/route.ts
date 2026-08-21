import { NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and 6-digit code are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    if (cleanCode.length !== 6) {
      return NextResponse.json({ error: 'Verification code must be 6 digits.' }, { status: 400 });
    }

    const result = await verifyOtpCode(cleanEmail, cleanCode);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Invalid or expired code.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email successfully verified.',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error verifying code.' },
      { status: 500 }
    );
  }
}
