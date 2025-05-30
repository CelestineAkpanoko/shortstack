import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function GET(req: NextRequest) {
  try {
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("❌ No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 1: Find the student profile
    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          ...(session.user.email ? [{ schoolEmail: session.user.email }] : []),
          { id: session.user.id }
        ]
      }
    });
    
    console.log("Student found:", student ? `ID: ${student.id}` : "❌ No student found");
    
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Step 2: Find enrollments
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: student.id,
        enrolled: true
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });
    
    console.log("Enrollments found:", enrollments.length);
    enrollments.forEach(enrollment => {
      console.log(`- Enrolled in class: ${enrollment.class.name} (${enrollment.class.code})`);
    });
    
    const classIds = enrollments.map(enrollment => enrollment.classId);
    
    if (classIds.length === 0) {
      console.log("❌ Student not enrolled in any classes");
      return NextResponse.json([]);
    }

    // Step 3: Find ALL store items for these classes (no filters first)
    const allStoreItemsInClasses = await db.storeItem.findMany({
      where: {
        class: {
          some: {
            id: { in: classIds }
          }
        }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            emoji: true
          }
        }
      }
    });
    
    console.log("Total store items in student's classes:", allStoreItemsInClasses.length);
    allStoreItemsInClasses.forEach(item => {
      console.log(`- Item: ${item.name}, Available: ${item.isAvailable}, Quantity: ${item.quantity}`);
    });

    // Step 4: Apply filters
    const availableItems = allStoreItemsInClasses.filter(item => 
      item.isAvailable && item.quantity > 0
    );
    
    console.log("Available items after filtering:", availableItems.length);
    
    return NextResponse.json(availableItems);
    
  } catch (error) {
    console.error("❌ Error in student storefront API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}