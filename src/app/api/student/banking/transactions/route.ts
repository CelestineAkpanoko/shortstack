import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try multiple ways to find the student record
    let student = await db.student.findFirst({
      where: {
        userId: session.user.id
      }
    });
    
    // If not found by userId, try finding by the ID directly
    if (!student && session.user.email) {
      student = await db.student.findFirst({
        where: { 
          schoolEmail: session.user.email 
        }
      });
    }
    
    // If still not found, try by the ID directly as a last resort
    if (!student) {
      student = await db.student.findUnique({
        where: { id: session.user.id }
      });
    }
    
    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    // Get all bank accounts for this student
    const bankAccounts = await db.bankAccount.findMany({
      where: {
        studentId: student.id,
      },
      select: {
        id: true
      }
    });

    const accountIds = bankAccounts.map(account => account.id);
    
    // Get all transactions for these accounts
    const transactions = await db.transaction.findMany({
      where: {
        accountId: {
          in: accountIds
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}