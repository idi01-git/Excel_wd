// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import * as bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter username and password');
        }

        const input = credentials.username.toLowerCase().trim();
        const user = await db.user.findFirst({
          where: {
            OR: [
              { username: input },
              { email: input }
            ]
          }
        });

        if (!user) {
          throw new Error('Invalid username or password');
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordCorrect) {
          throw new Error('Invalid username or password');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username,
          profilePhoto: user.profilePhoto
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log("JWT CALLBACK:", { trigger, token, user, session });
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.profilePhoto = (user as any).profilePhoto;
      }
      if (trigger === 'update' && session) {
        console.log("UPDATING JWT TOKEN WITH:", session);
        if (session.name) token.name = session.name;
        if (session.username) token.username = session.username;
        if (session.profilePhoto !== undefined) token.profilePhoto = session.profilePhoto;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("SESSION CALLBACK:", { session, token });
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).username = token.username as string;
        (session.user as any).profilePhoto = token.profilePhoto as string;
        session.user.name = token.name as string;
        session.user.image = token.profilePhoto as string; // Map to standard NextAuth image field
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET
};
