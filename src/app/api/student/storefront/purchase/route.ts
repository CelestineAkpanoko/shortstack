import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";

export async function POST(request: Request) {
  try {
    console.log("🔄 Starting purchase process...");

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "STUDENT") {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, quantity = 1 } = body;

    console.log("📦 Purchase request:", {
      itemId,
      quantity,
      userId: session.user.id,
    });

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // 1. Get the student with proper lookup
    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          ...(session.user.email ? [{ schoolEmail: session.user.email }] : []),
          { id: session.user.id },
        ],
      },
      include: {
        bankAccounts: {
          where: {
            accountType: "CHECKING",
          },
        },
        enrollments: {
          where: {
            enrolled: true,
          },
          select: {
            classId: true,
          },
        },
      },
    });

    console.log(
      "👤 Student lookup result:",
      student ? `Found: ${student.id}` : "Not found"
    );

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get checking account
    const checkingAccount = student.bankAccounts[0];
    console.log(
      "🏦 Checking account:",
      checkingAccount
        ? `Found: Balance ${checkingAccount.balance}`
        : "Not found"
    );

    if (!checkingAccount) {
      return NextResponse.json(
        { error: "Checking account not found" },
        { status: 400 }
      );
    }

    // Get enrolled class IDs
    const classIds = student.enrollments.map((e) => e.classId);
    console.log("📚 Enrolled classes:", classIds);

    // 2. Check if the item exists and is available in student's classes
    const item = await db.storeItem.findFirst({
      where: {
        id: itemId,
        isAvailable: true,
        quantity: { gte: quantity },
        class: {
          some: {
            id: { in: classIds },
          },
        },
      },
    });

    console.log(
      "🛍️ Item lookup:",
      item
        ? `Found: ${item.name}, Price: ${item.price}, Qty: ${item.quantity}`
        : "Not found"
    );

    if (!item) {
      return NextResponse.json(
        { error: "Item not available for purchase" },
        { status: 400 }
      );
    }

    // 3. Check if student has enough balance
    const totalPrice = item.price * quantity;
    console.log("💰 Price check:", {
      totalPrice,
      balance: checkingAccount.balance,
      sufficient: checkingAccount.balance >= totalPrice,
    });

    if (checkingAccount.balance < totalPrice) {
      return NextResponse.json(
        {
          error: "Insufficient balance to purchase this item",
          details: {
            currentBalance: checkingAccount.balance,
            needed: totalPrice - checkingAccount.balance,
            itemPrice: totalPrice,
          },
        },
        { status: 400 }
      );
    }

    // 3.5. Check for existing purchase (due to unique constraint)
    const existingPurchase = await db.studentPurchase.findUnique({
      where: {
        itemId_studentId: {
          itemId: item.id,
          studentId: student.id,
        },
      },
    });

    console.log(
      "🔍 Existing purchase check:",
      existingPurchase ? "Found existing purchase" : "No existing purchase"
    );

    if (existingPurchase) {
      // Update existing purchase instead of creating new one
      console.log("📝 Updating existing purchase...");

      const [updatedPurchase, updatedItem, updatedAccount, transaction] =
        await db.$transaction([
          // Update existing purchase
          db.studentPurchase.update({
            where: {
              itemId_studentId: {
                itemId: item.id,
                studentId: student.id,
              },
            },
            data: {
              quantity: existingPurchase.quantity + quantity,
              totalPrice: existingPurchase.totalPrice + totalPrice,
              status: "PAID",
              updatedAt: new Date(),
            },
          }),

          // Update item quantity
          db.storeItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity - quantity },
          }),

          // Update checking account balance
          db.bankAccount.update({
            where: { id: checkingAccount.id },
            data: { balance: checkingAccount.balance - totalPrice },
          }),

          // Create transaction record
          db.transaction.create({
            data: {
              accountId: checkingAccount.id,
              transactionType: "WITHDRAWAL",
              amount: totalPrice,
              description: `Purchase: ${item.emoji} ${item.name} (${quantity}x)`,
            },
          }),
        ]);

      console.log("✅ Purchase updated successfully");

      return NextResponse.json({
        success: true,
        purchase: updatedPurchase,
        newBalance: updatedAccount.balance,
      });
    } else {
      // 4. Process the purchase in a transaction (new purchase)
      console.log("🆕 Creating new purchase...");

      const [purchase, updatedItem, updatedAccount, transaction] =
        await db.$transaction([
          // Create purchase record
          db.studentPurchase.create({
            data: {
              studentId: student.id,
              itemId: item.id,
              quantity,
              totalPrice,
              status: "PAID",
            },
          }),

          // Update item quantity
          db.storeItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity - quantity },
          }),

          // Update checking account balance
          db.bankAccount.update({
            where: { id: checkingAccount.id },
            data: { balance: checkingAccount.balance - totalPrice },
          }),

          // Create transaction record
          db.transaction.create({
            data: {
              accountId: checkingAccount.id,
              transactionType: "WITHDRAWAL",
              amount: totalPrice,
              description: `Purchase: ${item.emoji} ${item.name} (${quantity}x)`,
            },
          }),
        ]);

      console.log("✅ New purchase created successfully");

      return NextResponse.json({
        success: true,
        purchase,
        newBalance: updatedAccount.balance,
      });
    }
  } catch (error) {
    console.error("❌ Error processing purchase:", error);

    return NextResponse.json(
      {
        error: "Failed to process purchase",
      },
      { status: 500 }
    );
  }
}
