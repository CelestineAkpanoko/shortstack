import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 1. Get the student's ID
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    });
    
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }
    
    // 2. Find all classes the student is enrolled in
    const enrollments = await db.enrollment.findMany({
      where: { 
        studentId: student.id,
        enrolled: true 
      },
      select: { 
        classId: true 
      }
    });
    
    if (enrollments.length === 0) {
      return NextResponse.json([]);
    }
    
    const classIds = enrollments.map(enrollment => enrollment.classId);
    
    // 3. Get available store items for these classes
    const storeItems = await db.storeItem.findMany({
      where: {
        isAvailable: true,
        quantity: { gt: 0 },
        class: {
          some: {
            id: { in: classIds }
          }
        }
      },
      select: {
        id: true,
        name: true,
        emoji: true,
        price: true,
        description: true,
        quantity: true,
        isAvailable: true,
        class: {
          select: {
            id: true,
            name: true,
            emoji: true
          }
        }
      },
      orderBy: { name: "asc" }
    });
    
    return NextResponse.json(storeItems);
    
  } catch (error) {
    console.error("Error fetching student store items:", error);
    return NextResponse.json(
      { error: "Failed to fetch store items" }, 
      { status: 500 }
    );
  }
}