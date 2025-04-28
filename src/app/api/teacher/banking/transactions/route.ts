import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get account ID from query parameters
    const url = new URL(req.url);
    const accountId = url.searchParams.get("accountId");
    
    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }
    
    // Get the account with its student to check teacher access
    const account = await db.bankAccount.findUnique({
      where: { id: accountId },
      include: {
        student: {
          include: {
            enrollments: {
              include: {
                class: true
              }
            }
          }
        }
      }
    });
    
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    
    // Check if the teacher has access to the student through a class
    const teacherClasses = account.student.enrollments.map(e => e.class).filter(c => c.userId === session.user.id);
    
    if (!teacherClasses.length) {
      return NextResponse.json({ error: "Access denied to this account" }, { status: 403 });
    }
    
    // Fetch the transactions
    const transactions = await db.transaction.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" }
    });
    
    return NextResponse.json(transactions);
    
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}