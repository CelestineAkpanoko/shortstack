import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fromAccountId, toAccountId, amount } = await request.json();
    
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Missing required fields or invalid amount" }, 
        { status: 400 }
      );
    }

    // Make sure the accounts belong to the student
    let student = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          ...(session.user.email ? [{ schoolEmail: session.user.email }] : []),
          { id: session.user.id }
        ]
      },
      include: {
        bankAccounts: true
      }
    });
    
    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }
    
    // Verify account ownership
    const studentAccountIds = student.bankAccounts.map(acc => acc.id);
    if (!studentAccountIds.includes(fromAccountId) || !studentAccountIds.includes(toAccountId)) {
      return NextResponse.json({ error: "Unauthorized access to accounts" }, { status: 403 });
    }
    
    // Get both accounts to determine their types
    const [fromAccount, toAccount] = await Promise.all([
      db.bankAccount.findUnique({
        where: { id: fromAccountId }
      }),
      db.bankAccount.findUnique({
        where: { id: toAccountId }
      })
    ]);
    
    if (!fromAccount) {
      return NextResponse.json({ error: "Source account not found" }, { status: 404 });
    }
    
    if (!toAccount) {
      return NextResponse.json({ error: "Destination account not found" }, { status: 404 });
    }
    
    if (fromAccount.balance < amount) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }
    
    // Create descriptive messages based on account types
    const fromAccountType = fromAccount.accountType === "CHECKING" ? "Checking" : "Savings";
    const toAccountType = toAccount.accountType === "CHECKING" ? "Checking" : "Savings";
    
    const transferDescription = `Transfer from ${fromAccountType} to ${toAccountType}`;
    
    // Perform the transfer in a transaction
    const result = await db.$transaction([
      // Deduct from source account
      db.bankAccount.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } }
      }),
      
      // Add to destination account
      db.bankAccount.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } }
      }),
      
      // Create transaction record for source (TRANSFER_OUT)
      db.transaction.create({
        data: {
          amount: Number(amount),
          description: transferDescription,
          transactionType: "TRANSFER_OUT",
          accountId: fromAccountId,
          receivingAccountId: toAccountId
        }
      }),
      
      // Create transaction record for destination (TRANSFER_IN)
      db.transaction.create({
        data: {
          amount: Number(amount),
          description: transferDescription,
          transactionType: "TRANSFER_IN",
          accountId: toAccountId,
          receivingAccountId: fromAccountId
        }
      })
    ]);
    
    return NextResponse.json({ 
      success: true, 
      message: "Transfer completed successfully",
      // Return updated accounts to refresh UI
      data: {
        fromAccount: {
          ...fromAccount,
          balance: fromAccount.balance - Number(amount)
        },
        toAccount: {
          ...toAccount,
          balance: toAccount.balance + Number(amount)
        }
      }
    });
    
  } catch (error) {
    console.error("Error processing transfer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}