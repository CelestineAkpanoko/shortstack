"use server";

import { db } from "@/src/lib/db";
import { getAuthSession } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { PurchaseStatus } from "@prisma/client"; // Import enum

// Types
interface CreateStoreItemData {
  name: string;
  emoji: string;
  price: number;
  description?: string;
  quantity: number;
  isAvailable: boolean;
  classId: string; // Item must belong to a class
}

interface UpdateStoreItemData {
  name?: string;
  emoji?: string;
  price?: number;
  description?: string;
  quantity?: number;
  isAvailable?: boolean;
}

interface StoreItemResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// Create a new store item (Teacher only)
export async function createStoreItem(formData: FormData): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const emoji = formData.get("emoji") as string;
    const price = parseFloat(formData.get("price") as string);
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const isAvailable = formData.get("isAvailable") === 'true';
    const description = formData.get("description") as string | undefined;
    const classId = formData.get("classId") as string;

    if (!name || !emoji || isNaN(price) || isNaN(quantity) || !classId) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify teacher owns the class
    const classObj = await db.class.findUnique({
      where: { id: classId },
      select: { userId: true, code: true }
    });

    if (!classObj || classObj.userId !== session.user.id) {
      return { success: false, error: "Class not found or access denied" };
    }

    const newItem = await db.storeItem.create({
      data: {
        name,
        emoji,
        price,
        description,
        quantity,
        isAvailable,
        classId,
      },
    });

    revalidatePath(`/dashboard/classes/${classObj.code}/store`);
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error("Create store item error:", error);
    return { success: false, error: "Failed to create store item" };
  }
}

// Get all store items for a class (Teacher owner or enrolled Student)
export async function getStoreItems(classId: string): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify class exists
    const classObj = await db.class.findUnique({
      where: { id: classId },
      select: { userId: true, code: true }
    });
    if (!classObj) {
      return { success: false, error: "Class not found" };
    }

    // Authorization check
    let authorized = false;
    if (session.user.role === "TEACHER" && classObj.userId === session.user.id) {
        authorized = true;
    } else if (session.user.role === "STUDENT") {
        const enrollment = await db.enrollment.findFirst({
            where: { classId: classId, student: { userId: session.user.id }, enrolled: true }
        });
        if (enrollment) {
            authorized = true;
        }
    }

    if (!authorized) {
        return { success: false, error: "Forbidden: You do not have access to this class store" };
    }

    const items = await db.storeItem.findMany({
      where: { classId: classId },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: items };
  } catch (error: any) {
    console.error("Get store items error:", error);
    return { success: false, error: "Failed to fetch store items" };
  }
}

// Update a store item (Teacher only)
export async function updateStoreItem(
  id: string,
  data: UpdateStoreItemData
): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify teacher owns the class associated with the item
    const item = await db.storeItem.findUnique({
      where: { id },
      include: { class: { select: { userId: true, code: true } } }
    });

    if (!item || item.class.userId !== session.user.id) {
      return { success: false, error: "Forbidden or Item not found" };
    }

    const updatedItem = await db.storeItem.update({
      where: { id },
      data,
    });

    revalidatePath(`/dashboard/classes/${item.class.code}/store`);
    return { success: true, data: updatedItem };
  } catch (error: any) {
    console.error("Update store item error:", error);
    return { success: false, error: "Failed to update store item" };
  }
}

// Delete a store item (Teacher only)
export async function deleteStoreItem(id: string): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify teacher owns the class associated with the item
    const item = await db.storeItem.findUnique({
      where: { id },
      include: { class: { select: { userId: true, code: true } } }
    });

    if (!item || item.class.userId !== session.user.id) {
      return { success: false, error: "Forbidden or Item not found" };
    }

    // Delete associated purchases first (or use cascade delete)
    await db.studentPurchase.deleteMany({ 
      where: { 
        itemId: id // Change storeItemId to itemId if that's what your schema uses
      } 
    });

    await db.storeItem.delete({ where: { id } });

    revalidatePath(`/dashboard/classes/${item.class.code}/store`);
    return { success: true };
  } catch (error: any) {
    console.error("Delete store item error:", error);
    return { success: false, error: "Failed to delete store item" };
  }
}

// Purchase a store item (Student only)
export async function purchaseStoreItem(
  itemId: string,
  // studentId is derived from session
  quantity: number
): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return { success: false, error: "Unauthorized: Only students can purchase items" };
    }

    // Find the student record associated with the user
    const student = await db.student.findUnique({
      where: { id: session.user.id },
      include: { bankAccounts: true }
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (quantity <= 0) {
      return { success: false, error: "Quantity must be positive" };
    }

    // Assuming the student has a checking account
    const checkingAccount = student.bankAccounts.find(
      acc => acc.accountType === "CHECKING"
    );

    // Get item details to calculate total price
    const item = await db.storeItem.findUnique({
      where: { id: itemId },
    });
    
    if (!item) {
      return { success: false, error: "Item not found" };
    }
    
    const totalPrice = item.price * quantity;

    if (!checkingAccount || checkingAccount.balance < totalPrice) {
      return { success: false, error: "Insufficient funds" };
    }

    // Use transaction for purchase logic
    const result = await db.$transaction(async (tx) => {
      // Get item details and lock the row for update
      const item = await tx.storeItem.findUnique({
        where: { id: itemId },
      });

      if (!item) throw new Error("Item not found");
      if (!item.isAvailable) throw new Error("Item is not available for purchase");
      if (item.quantity < quantity) throw new Error("Insufficient stock available");

      const totalPrice = item.price * quantity;

      // Update the bank account balance instead
      await tx.bankAccount.update({
        where: { id: checkingAccount.id },
        data: { balance: { decrement: totalPrice } }
      });

      // Decrement item quantity
      const updatedItem = await tx.storeItem.update({
        where: { id: itemId },
        data: { quantity: { decrement: quantity } }
      });

      // Create purchase record
      const purchase = await tx.studentPurchase.create({
        data: {
          studentId: student.id,
          itemId: itemId, // Changed from storeItemId to itemId
          quantity: quantity,
          totalPrice: totalPrice, // Changed from price to amount, assuming this is the correct field name
          status: "PAID", // Changed from COMPLETED to PAID if that's what your enum allows
        }
      });

      return { purchase, updatedItem };
    });

    // Revalidate relevant paths (e.g., student balance display, store item list)
    // Need class code for revalidation
    const itemClass = await db.storeItem.findUnique({ where: { id: itemId }, select: { class: { select: { code: true } } } });
    if (itemClass) {
      revalidatePath(`/dashboard/classes/${itemClass.class.code}/store`);
      // Revalidate student-specific pages if applicable
    }

    return { success: true, data: result.purchase };

  } catch (error: any) {
    console.error("Purchase store item error:", error);
    // Check for specific transaction errors (e.g., insufficient balance/stock)
    if (error.message === "Insufficient balance" || error.message === "Insufficient stock available" || error.message === "Item not found" || error.message === "Item is not available for purchase") {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to purchase item" };
  }
}
