import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentIds, accountType, amount, description } = await request.json();
    
    if (!studentIds || !studentIds.length || !accountType || !amount || amount <= 0) {
      return NextResponse.json({ 
        error: "Missing required fields or invalid amount" 
      }, { status: 400 });
    }

    // Process each student in parallel
    const results = await Promise.all(
      studentIds.map(async (studentId: string) => {
        // Find the student's account
        const account = await db.bankAccount.findFirst({
          where: {
            studentId,
            accountType: accountType.toUpperCase(),
          },
        });

        if (!account) {
          return { 
            studentId, 
            success: false, 
            error: "Account not found" 
          };
        }

        if (account.balance < amount) {
          return { 
            studentId, 
            success: false, 
            error: "Insufficient funds" 
          };
        }

        // Remove funds from the account and create transaction record
        await db.$transaction([
          // Update account balance
          db.bankAccount.update({
            where: { id: account.id },
            data: { balance: { decrement: amount } },
          }),
          
          // Create transaction record
          db.transaction.create({
            data: {
              accountId: account.id,
              amount,
              description: description || "Funds removed by teacher",
              transactionType: "WITHDRAWAL",
            },
          }),
        ]);

        return { studentId, success: true };
      })
    );

    // Check if any operations failed
    const failures = results.filter(r => !r.success);
    
    if (failures.length) {
      return NextResponse.json({ 
        warning: "Some operations failed",
        failures,
        successes: results.filter(r => r.success).length
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully removed funds from ${results.length} accounts`
    });
  } catch (error) {
    console.error("Error removing funds:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}