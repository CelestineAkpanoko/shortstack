import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { storeItemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const storeItemId = params.storeItemId;
    
    if (!storeItemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }
    
    // Get the student's ID
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true, classId: true }
    });
    
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }
    
    // Find the store item that belongs to the student's class
    const storeItem = await db.storeItem.findFirst({
      where: {
        id: storeItemId,
        class: {
          some: {
            id: student.classId
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
      }
    });
    
    if (!storeItem) {
      return NextResponse.json(
        { error: "Item not found or not available in your class" }, 
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