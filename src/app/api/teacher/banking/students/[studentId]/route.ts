import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

export async function GET(
  request: Request,
  context: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher record
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    // Await the params to properly access studentId
    const { studentId } = await context.params;

    // Check if the teacher has access to this student through enrollment
    const hasAccess = await db.enrollment.findFirst({
      where: {
        studentId: studentId,
        class: {
          teacherId: teacher.id,
        },
        enrolled: true,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this student" }, { status: 403 });
    }

    // Get student details with bank accounts
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        schoolEmail: true,
        bankAccounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Format the response
    return NextResponse.json({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.schoolEmail,
      accounts: student.bankAccounts,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}