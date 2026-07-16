import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from './lib/admin/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow login page and login API
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  // Check JWT cookie
  const token = request.cookies.get('pblog_admin_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    if (!(await verifyAdminToken(token))) throw new Error('invalid admin token');
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('pblog_admin_token');
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
