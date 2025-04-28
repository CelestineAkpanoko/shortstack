import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

// GET: Fetch student profile with teacher info
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find student profile using the correct relation name
    const student = await db.student.findFirst({
      where: {
        schoolEmail: session.user.email,
      },
      include: {
        class: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Access the teacher through the class
    const teacher = student.class?.user;
    const teacherName = teacher?.name || 
      `${teacher?.firstName || ''} ${teacher?.lastName || ''}`.trim() || 
      'Your Teacher';

    return NextResponse.json({ 
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        schoolEmail: student.schoolEmail,
        progress: student.progress,
        profileImage: student.profileImage,
        teacher: {
          id: teacher?.id,
          name: teacherName,
          email: teacher?.email,
          image: teacher?.image,
        }
      } 
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json({ error: "Failed to fetch student profile" }, { status: 500 });
  }
}