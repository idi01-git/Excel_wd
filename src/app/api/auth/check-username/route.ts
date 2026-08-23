// src/app/api/auth/check-username/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateUsername } from '@/lib/registration';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get('username') || '';
    const clean = rawUsername.trim().toLowerCase();

    if (!clean) {
      return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
    }

    const validation = validateUsername(clean);
    if (!validation.valid) {
      return NextResponse.json({ available: false, error: validation.error });
    }

    const existing = await db.user.findUnique({
      where: { username: clean },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ available: false, error: 'Username is already taken' });
    }

    return NextResponse.json({ available: true, username: clean });
  } catch (err: unknown) {
    console.error('Check username error:', err);
    return NextResponse.json({ available: false, error: 'Failed to verify username availability' }, { status: 500 });
  }
}
