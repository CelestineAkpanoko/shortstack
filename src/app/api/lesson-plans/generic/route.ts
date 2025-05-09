import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch all generic lesson plans
    const genericLessonPlans = await db.genericLessonPlan.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            lessonPlans: true // Count how many times this template has been used
          }
        }
      },
      orderBy: [
        // Show most popular templates first
        { lessonPlans: { _count: 'desc' } },
        { name: 'asc' }
      ]
    });
    
    return NextResponse.json(genericLessonPlans);
  } catch (error) {
    console.error("Error fetching generic lesson plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson plan templates" },
      { status: 500 }
    );
  }
}