// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

const handler = NextAuth(authOptions);

export const GET = async (req: NextRequest, props: { params: Promise<any> }) => {
  const params = await props.params;
  return handler(req, { params });
};

export const POST = async (req: NextRequest, props: { params: Promise<any> }) => {
  const params = await props.params;
  return handler(req, { params });
};
