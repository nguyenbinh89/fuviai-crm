import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes yêu cầu phải đăng nhập
const PROTECTED_ROUTES = ['/dashboard'];
// Routes chỉ dành cho chưa đăng nhập
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check refresh token cookie (httpOnly — chỉ có thể check sự tồn tại)
  const hasRefreshToken = request.cookies.has('refresh_token');

  // Redirect đã đăng nhập truy cập auth pages → dashboard
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && hasRefreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect chưa đăng nhập truy cập protected routes → login
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Chạy middleware trên tất cả các routes trừ static files và api
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
