import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  // Protect routes for teacher and student dashboards
  if (pathname.startsWith("/teacher/dashboard")) {
    if (!session) {
      const url = new URL("/teacher", req.url);
      return NextResponse.redirect(url);
    }

    // Ensure only teachers can access teacher dashboard
    if (session.role !== "TEACHER") {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/teacher/dashboard/:path*", 
    "/student/dashboard/:path*",
    "/api/restricted/:path*"
  ]
};