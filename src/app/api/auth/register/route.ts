// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, username, email, password } = await req.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'Missing required registration parameters' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.toLowerCase().trim();

    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters and alphanumeric' }, { status: 400 });
    }

    // Check existing
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        profilePhoto: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanUsername}`
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
