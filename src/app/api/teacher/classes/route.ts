import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get all classes for this teacher
    const classes = await db.class.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        code: true,
        emoji: true,
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Return direct array of classes for simpler client consumption
    return NextResponse.json(classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      emoji: cls.emoji,
      studentCount: cls._count.students
    })));
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" }, 
      { status: 500 }
    );
  }
}