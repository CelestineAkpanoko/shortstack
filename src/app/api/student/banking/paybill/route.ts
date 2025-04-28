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

    const { billId, accountId, amount } = await request.json();
    
    if (!billId || !accountId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Missing required fields or invalid amount" }, 
        { status: 400 }
      );
    }

    // Find student
    const student = await db.student.findFirst({
      where: {
        schoolEmail: session.user?.email || "",
      },
      include: {
        bankAccounts: true,
      }
    });
    
    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }
    
    // Verify account ownership
    const studentAccountIds = student?.bankAccounts?.map(acc => acc.id) || [];
    if (!studentAccountIds.includes(accountId)) {
      return NextResponse.json({ error: "Unauthorized access to account" }, { status: 403 });
    }
    
    // Get account details
    const account = await db.bankAccount.findUnique({
      where: { id: accountId }
    });
    
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    
    if (account.balance < amount) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }
    
    // Find the bill
    const bill = await db.bill.findUnique({
      where: { id: billId },
      include: {
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    
    // Check if student already has a record for this bill
    const existingStudentBill = await db.studentBill.findFirst({
      where: {
        billId: billId,
        studentId: student.id
      }
    });

    // Calculate payment details
    const currentPaidAmount = existingStudentBill?.paidAmount || 0;
    const newPaidAmount = currentPaidAmount + Number(amount);
    const isPaid = newPaidAmount >= bill.amount;
    
    // Prevent overpayment
    if (amount > (bill.amount - currentPaidAmount)) {
      return NextResponse.json({ 
        error: `Payment amount exceeds remaining bill amount of ${(bill.amount - currentPaidAmount).toFixed(2)}` 
      }, { status: 400 });
    }
    
    // Process payment in a transaction
    await db.$transaction(async (tx) => {
      // 1. Update bank account balance
      await tx.bankAccount.update({
        where: { id: accountId },
        data: { 
          balance: { decrement: Number(amount) } 
        }
      });
      
      // 2. Create or update studentBill record
      if (existingStudentBill) {
        await tx.studentBill.update({
          where: { id: existingStudentBill.id },
          data: {
            paidAmount: newPaidAmount,
            isPaid: isPaid,
            paidAt: isPaid ? new Date() : existingStudentBill.paidAt
          }
        });
      } else {
        await tx.studentBill.create({
          data: {
            billId: billId,
            studentId: student.id,
            amount: bill.amount,  // Store the original bill amount
            paidAmount: Number(amount),
            isPaid: isPaid,
            dueDate: bill.dueDate,
            paidAt: isPaid ? new Date() : null
          }
        });
      }
      
      // 3. Create transaction record
      await tx.transaction.create({
        data: {
          amount: Number(amount),
          description: `Payment for ${bill.title}`,
          transactionType: "WITHDRAWAL", // Use WITHDRAWAL until you add BILL_PAYMENT to your enum
          accountId: accountId
        }
      });
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Payment processed successfully",
      data: {
        account: {
          ...account,
          balance: account.balance - Number(amount)
        },
        bill: {
          ...bill,
          paidAmount: newPaidAmount,
          isPaid: isPaid
        }
      }
    });
    
  } catch (error) {
    console.error("Error processing bill payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}