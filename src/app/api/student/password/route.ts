import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const { currentPassword, newPassword } = await request.json();

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get the student from database
    const student = await db.student.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, student.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update student's password in the database
    await db.student.update({
      where: { id: student.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Password updated successfully" 
    });
    
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}