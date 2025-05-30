import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // ✅ Await the params
    const { storeItemId } = await params;
    
    if (!storeItemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }
    
    // Get the student's ID
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    });
    
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // ✅ FIXED: Use correct relationship structure from schema
    const storeItem = await db.storeItem.findFirst({
      where: {
        id: storeItemId,
        isAvailable: true,
        // Check if the student is enrolled in any class that has this store item
        class: {
          some: {
            enrollments: {
              some: {
                studentId: student.id,
                enrolled: true
              }
            }
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
            emoji: true,
            code: true
          }
        }
      }
    });
    
    if (!storeItem) {
      return NextResponse.json(
        { error: "Item not found or not available in your classes" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(storeItem);
    
  } catch (error) {
    console.error("Error fetching store item:", error);
    return NextResponse.json(
      { error: "Failed to fetch store item" }, 
      { status: 500 }
    );
  }
}