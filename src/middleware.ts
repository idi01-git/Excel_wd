// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const userRole = token?.role as string | undefined;

    // RBAC: Locked to MODERATOR and ADMIN only
    if (path.startsWith('/moderator')) {
      if (userRole !== 'MODERATOR' && userRole !== 'ADMIN') {
        // Redirect to a custom unauthorized or base path
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Redirect to login if not authenticated
    },
  }
);

export const config = {
  matcher: [
    '/workspace/:path*',
    '/moderator/:path*'
  ],
};
