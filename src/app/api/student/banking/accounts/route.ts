import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

// Helper function to add prefixes to account numbers
const addPrefixToAccount = (account: any) => {
  if (!account) return account;
  
  const prefix = account.accountType === "CHECKING" ? "CH" : "SV";
  return {
    ...account,
    displayAccountNumber: `${prefix}${account.accountNumber}`
  };
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try multiple ways to find the student record
    let student = await db.student.findFirst({
      where: {
        userId: session.user.id
      }
    });
    
    // If not found by userId, try finding by the ID directly
    // This handles the case where session.user.id might be the student.id
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
      // Log more details for debugging
      console.error("Student record not found for user:", {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      });
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    const bankAccounts = await db.bankAccount.findMany({
      where: {
        studentId: student.id,
      },
      orderBy: {
        createdAt: "asc", 
      },
    });

    // Add prefixes to account numbers
    const accountsWithPrefixes = bankAccounts.map(addPrefixToAccount);

    // Return accounts array (will be empty if no accounts found)
    return NextResponse.json(accountsWithPrefixes);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}