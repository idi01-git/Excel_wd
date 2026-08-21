import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { hasPermission } from '@/lib/rbac';

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname, search } = request.nextUrl;

  const isWorkspaceRoute = pathname.startsWith('/workspace');
  const isModeratorRoute = pathname.startsWith('/moderator');

  if (!isWorkspaceRoute && !isModeratorRoute) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/login') {
      loginUrl.searchParams.set('callbackUrl', pathname + search);
    }
    return NextResponse.redirect(loginUrl);
  }

  const role = (token as { role?: string }).role;
  if (isModeratorRoute && !hasPermission(role, 'MODERATE_PUBLICATIONS')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/workspace/:path*', '/moderator/:path*']
};
