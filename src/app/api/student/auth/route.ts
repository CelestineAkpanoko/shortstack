import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import bcrypt from "bcryptjs";
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { schoolEmail, password } = await request.json();

    if (!schoolEmail || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    // Find the student by schoolEmail
    const student = await db.student.findUnique({
      where: { schoolEmail },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify provided password against the hashed password
    const isValid = await bcrypt.compare(password, student.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token for student session
    const token = sign(
      { 
        studentId: student.id, 
        email: student.schoolEmail,
        firstName: student.firstName,
        lastName: student.lastName
      },
      process.env.JWT_SECRET || 'fallback-secret-key-for-development',
      { expiresIn: '7d' } // Token valid for 7 days
    );

    // Set HTTP-only cookie with the token
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'student-auth-token',
      value: token,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict',
      // secure: process.env.NODE_ENV === 'production'
    });

    return NextResponse.json(
      { 
        success: true, 
        data: { 
          studentId: student.id, 
          firstName: student.firstName,
          lastName: student.lastName,
          schoolEmail: student.schoolEmail,
          classId: student.classId
        } 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Student auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Logout endpoint
export async function DELETE() {
  // Clear the auth cookie
  const cookieStore = await cookies();
  cookieStore.delete('student-auth-token');
  
  return NextResponse.json({ success: true });
}