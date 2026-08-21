// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import { Role } from '@/lib/rbac';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      username: string;
      profilePhoto?: string | null;
      verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: Role;
    username: string;
    profilePhoto?: string | null;
    verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    username: string;
    profilePhoto?: string | null;
    verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  }
}
