import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  // Protect routes for teacher and student dashboards
  if (pathname.startsWith("/teacher/dashboard")) {
    if (!session) {
      const url = new URL("/teacher", req.url);
      return NextResponse.redirect(url);
    }

    // Allow both TEACHER and SUPER roles to access teacher dashboard
    if (session.role !== "TEACHER" && session.role !== "SUPER") {
      const url = new URL("/student/dashboard", req.url);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/student/dashboard")) {
    if (!session) {
      const url = new URL("/student", req.url);
      return NextResponse.redirect(url);
    }

    // Ensure only students can access student dashboard
    if (session.role !== "STUDENT") {
      const url = new URL("/teacher/dashboard", req.url);
      return NextResponse.redirect(url);
    }
  }

  // Prevent access to the missing main-app.js which causes 404s
  if (req.nextUrl.pathname.includes('/static/chunks/main-app.js')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/teacher/dashboard/:path*",
    "/student/dashboard/:path*",
    "/api/:path*",
    "/api/restricted/:path*",
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};