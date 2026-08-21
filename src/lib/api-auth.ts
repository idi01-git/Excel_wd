// src/lib/api-auth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { hasPermission, isStaff, Permission, Role } from './rbac';
import { NextResponse } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  username: string;
  profilePhoto?: string | null;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface AuthSession {
  user: AuthenticatedUser;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session as unknown as AuthSession;
}

export async function requireLogin() {
  const session = await getAuthSession();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}

export async function requirePermission(perm: Permission) {
  const session = await getAuthSession();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // Pending verification check: pending accounts cannot perform staff actions
  if (session.user.verificationStatus === 'PENDING' && perm !== 'INTERACT') {
    return {
      session,
      error: NextResponse.json(
        { error: 'Account pending verification' },
        { status: 403 }
      ),
    };
  }

  if (!hasPermission(session.user.role, perm)) {
    return {
      session,
      error: NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

export async function requireStaff() {
  const session = await getAuthSession();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (!isStaff(session.user.role)) {
    return {
      session,
      error: NextResponse.json(
        { error: 'Forbidden: Staff access required' },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
