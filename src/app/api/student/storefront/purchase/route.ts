import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function POST(request: Request) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id || session.user.role !== "STUDENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const body = await request.json();
      const { itemId, quantity = 1 } = body;
      
      if (!itemId) {
        return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
      }
      
      // 1. Get the student with checking account
      const student = await db.student.findFirst({
        where: { userId: session.user.id },
        select: { 
          id: true,
          classId: true,
          bankAccounts: {
            where: {
              accountType: "CHECKING"
            }
          }
        }
      });
      
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      
      // Get checking account
      const checkingAccount = student.bankAccounts[0];
      if (!checkingAccount) {
        return NextResponse.json({ error: "Checking account not found" }, { status: 400 });
      }
      
      // 2. Check if the item exists and is available
      const item = await db.storeItem.findFirst({
        where: {
          id: itemId,
          isAvailable: true,
          quantity: { gte: quantity },
          class: {
            some: {
              id: student.classId
            }
          }
        }
      });
      
      if (!item) {
        return NextResponse.json({ error: "Item not available for purchase" }, { status: 400 });
      }
      
      // 3. Check if student has enough balance
      const totalPrice = item.price * quantity;
      
      if (checkingAccount.balance < totalPrice) {
        return NextResponse.json({ 
          error: "Insufficient balance to purchase this item" 
        }, { status: 400 });
      }
      
      // 4. Process the purchase in a transaction
      const [purchase, updatedItem, updatedAccount] = await db.$transaction([
        // Create purchase record
        db.studentPurchase.create({
          data: {
            studentId: student.id,
            itemId: item.id,
            quantity,
            totalPrice,
            status: "PAID"
          }
        }),
        
        // Update item quantity
        db.storeItem.update({
          where: { id: item.id },
          data: { quantity: item.quantity - quantity }
        }),
        
        // Update checking account balance
        db.bankAccount.update({
          where: { id: checkingAccount.id },
          data: { balance: checkingAccount.balance - totalPrice }
        })
      ]);
      
      return NextResponse.json({
        success: true,
        purchase
      });
      
    } catch (error) {
      console.error("Error processing purchase:", error);
      return NextResponse.json(
        { error: "Failed to process purchase" }, 
        { status: 500 }
      );
    }
  }