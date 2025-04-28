import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { setupBankAccountsForStudent } from "@/src/lib/banking";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try multiple ways to find the student record
    let student = await db.student.findFirst({
      where: {
        userId: session.user.id
      }
    });
    
    // Try finding by email if not found by userId
    if (!student && session.user.email) {
      student = await db.student.findFirst({
        where: { 
          schoolEmail: session.user.email 
        }
      });
    }
    
    // Last resort, try finding directly by ID
    if (!student) {
      student = await db.student.findUnique({
        where: { id: session.user.id }
      });
    }
    
    if (!student) {
      // Add more context for debugging
      console.error("Student record not found for setup:", {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      });
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    // Use the shared utility function
    const result = await setupBankAccountsForStudent(student.id);
    
    // Ensure result has an error property or use optional chaining
    if (!result.success) {
      return NextResponse.json({ error: "Failed to create accounts" }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error setting up bank accounts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}