// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import * as bcrypt from 'bcryptjs';
import { Role } from './rbac';
import { VerificationStatus } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter username and password');
        }

        const input = credentials.username.toLowerCase().trim();
        const user = await db.user.findFirst({
          where: {
            OR: [{ username: input }, { email: input }],
          },
        });

        if (!user) {
          throw new Error('Invalid username or password');
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          throw new Error('Invalid username or password');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          username: user.username,
          profilePhoto: user.profilePhoto,
          verificationStatus: user.verificationStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.username = user.username;
        token.profilePhoto = user.profilePhoto;
        token.verificationStatus = user.verificationStatus;
      }
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.username) token.username = session.username;
        if (session.profilePhoto !== undefined)
          token.profilePhoto = session.profilePhoto;
        if (session.verificationStatus)
          token.verificationStatus = session.verificationStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
        // Re-read role and verification status from DB so role changes take effect immediately on navigation
        const freshUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            verificationStatus: true,
            name: true,
            username: true,
            profilePhoto: true,
          },
        });

        session.user.role = (freshUser?.role as Role) ?? ((token.role as Role) || 'VISITOR');
        session.user.verificationStatus =
          freshUser?.verificationStatus ??
          (token.verificationStatus as VerificationStatus | undefined) ??
          'UNVERIFIED';
        session.user.username = freshUser?.username ?? (token.username as string);
        session.user.name = freshUser?.name ?? token.name;
        session.user.image = freshUser?.profilePhoto ?? (token.profilePhoto as string) ?? null;
        session.user.profilePhoto = freshUser?.profilePhoto ?? (token.profilePhoto as string) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
