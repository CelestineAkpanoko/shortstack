import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First attempt: find student by direct association with user ID
    let student = await db.student.findFirst({
      where: { 
        userId: session.user.id 
      },
      include: {
        enrollments: {
          where: { enrolled: true },
          include: {
            class: {
              include: {
                user: true // Teacher info
              }
            }
          }
        }
      }
    });

    // Second attempt: if no direct association, check by email
    if (!student && session.user.email) {
      student = await db.student.findFirst({
        where: { 
          schoolEmail: session.user.email 
        },
        include: {
          enrollments: {
            where: { enrolled: true },
            include: {
              class: {
                include: {
                  user: true // Teacher info
                }
              }
            }
          }
        }
      });
    }

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Format the enrolled classes
    const classes = student.enrollments.map(enrollment => ({
      id: enrollment.class.id,
      name: enrollment.class.name,
      code: enrollment.class.code,
      emoji: enrollment.class.emoji || "📚"
    }));
    
    // Get teacher info from the first enrolled class
    const teacherInfo = student.enrollments[0]?.class?.user;
    const teacher = teacherInfo ? {
      id: teacherInfo.id,
      name: teacherInfo.name || `${teacherInfo.firstName || ''} ${teacherInfo.lastName || ''}`.trim(),
      firstName: teacherInfo.firstName,
      lastName: teacherInfo.lastName,
      email: teacherInfo.email,
      image: teacherInfo.image
    } : null;

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        schoolEmail: student.schoolEmail,
        progress: student.progress || {},
        profileImage: student.profileImage,
        teacher: teacher
      },
      classes: classes
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json({ error: "Failed to fetch student profile" }, { status: 500 });
  }
}