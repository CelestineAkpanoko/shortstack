"use server";

import { db } from "@/src/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

// Types
interface CreateStoreItemData {
  name: string;
  emoji: string;
  price: number;
  description?: string;
  quantity: number;
  isAvailable: boolean;
}

interface UpdateStoreItemData {
  name: string;
  emoji: string;
  price: number;
  description?: string;
  quantity: number;
  isAvailable: boolean;
}

interface StoreItemResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Create a new store item
export async function createStoreItem(formData: FormData): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    const data: CreateStoreItemData = {
      name: formData.get("name") as string,
      emoji: formData.get("emoji") as string || "🛍️",
      price: parseFloat(formData.get("price") as string),
      description: formData.get("description") as string,
      quantity: parseInt(formData.get("quantity") as string, 10),
      isAvailable: formData.get("isAvailable") === "true",
    };

    // Validate required fields
    if (!data.name || !data.price) {
      return { success: false, error: "Missing required fields" };
    }

    const newItem = await db.storeItem.create({
      data
    });

    revalidatePath("/dashboard/storefront");
    return { success: true, data: newItem };
  } catch (error) {
    console.error("Create store item error:", error);
    return { success: false, error: "Failed to create store item" };
  }
}

export async function getStoreItems(classId?: string): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    // For many-to-many relationships, use "some" to filter
    let whereClause: any = {
      class: {
        some: {
          userId
        }
      }
    };

    // If filtering by classId
    if (classId) {
      whereClause = {
        class: {
          some: {
            id: classId,
            userId
          }
        }
      };
    }

    const items = await db.storeItem.findMany({
      where: whereClause,
      include: {
        class: true
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Get store items error:", error);
    return { success: false, error: "Failed to fetch store items" };
  }
}

// interface CopyStoreItemToClassParams {
//   storeItemId: string;
//   targetClassIds: string[];
// }
// // Copy a store item to multiple classes
// export async function copyStoreItemToClasses({
//   storeItemId,
//   targetClassIds
// }: CopyStoreItemToClassParams): Promise<StoreItemResponse> {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return { success: false, error: "Not authorized" };
//     }

//     // Validate input
//     if (!storeItemId) {
//       return { success: false, error: "Store item ID is required" };
//     }
    
//     if (!targetClassIds || targetClassIds.length === 0) {
//       return { success: false, error: "At least one target class must be selected" };
//     }

//     // Get the original store item
//     const originalItem = await db.storeItem.findUnique({
//       where: {
//         id: storeItemId,
//         class: {
//           some: {
//             userId
//           }
//         }
//       },
//       include: {
//         class: true
//       }
//     });

//     if (!originalItem) {
//       return { success: false, error: "Store item not found" };
//     }

//     // Verify the user owns this item
//     if (originalItem.userId !== userId) {
//       return { success: false, error: "You don't have permission to assign this item" };
//     }

//     // Check if the item is already assigned to any of the target classes
//     const existingAssignments = await db.storeItem.findMany({
//       where: {
//         name: originalItem.name,
//         classId: { in: targetClassIds }
//       },
//       select: {
//         classId: true
//       }
//     });

//     // Filter out classes that already have this item
//     const existingClassIds = existingAssignments.map(item => item.classId);
//     const newTargetClassIds = targetClassIds.filter(id => !existingClassIds.includes(id));

//     if (newTargetClassIds.length === 0) {
//       return { 
//         success: false, 
//         error: "This item is already assigned to all selected classes" 
//       };
//     }

//     // Create copies of the store item for each target class
//     const creationPromises = newTargetClassIds.map(classId => 
//       db.storeItem.create({
//         data: {
//           name: originalItem.name,
//           emoji: originalItem.emoji,
//           price: originalItem.price,
//           description: originalItem.description,
//           quantity: originalItem.quantity,
//           isAvailable: originalItem.isAvailable,
//           classId: classId,
//           userId: userId // Ensure the item is owned by current user
//         }
//       })
//     );

//     const createdItems = await Promise.all(creationPromises);

//     revalidatePath("/dashboard/storefront");
    
//     // Create appropriate success message
//     let message = "";
//     if (existingClassIds.length > 0) {
//       message = `Item assigned to ${newTargetClassIds.length} additional ${newTargetClassIds.length === 1 ? 'class' : 'classes'}. ${existingClassIds.length} ${existingClassIds.length === 1 ? 'class was' : 'classes were'} skipped as the item was already assigned.`;
//     } else {
//       message = `Item successfully assigned to ${newTargetClassIds.length} ${newTargetClassIds.length === 1 ? 'class' : 'classes'}.`;
//     }
    
//     return { 
//       success: true,
//       message,
//       data: createdItems
//     };
//   } catch (error) {
//     console.error("Copy store item error:", error);
//     return { success: false, error: "Failed to assign store item to classes" };
//   }
// }


// Assign class to store item
export async function assignClassToStoreItem(
  itemId: string,
  classId: string
): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    const updatedItem = await db.storeItem.update({
      where: { id: itemId },
      data: { classId }
    });

    revalidatePath("/dashboard/storefront");
    return { success: true, data: updatedItem };
  } catch (error) {
    console.error("Assign class error:", error);
    return { success: false, error: "Failed to assign class to store item" };
  }
}

// Update a store item
export async function updateStoreItem(
  id: string,
  data: UpdateStoreItemData
): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    const updatedItem = await db.storeItem.update({
      where: { id },
      data
    });

    revalidatePath("/dashboard/storefront");
    return { success: true, data: updatedItem };
  } catch (error) {
    console.error("Update store item error:", error);
    return { success: false, error: "Failed to update store item" };
  }
}

// Delete a store item
export async function deleteStoreItem(id: string): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    await db.storeItem.delete({
      where: { id }
    });

    revalidatePath("/dashboard/storefront");
    return { success: true };
  } catch (error) {
    console.error("Delete store item error:", error);
    return { success: false, error: "Failed to delete store item" };
  }
}

// Purchase a store item
export async function purchaseStoreItem(
  itemId: string,
  studentId: string,
  quantity: number
): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    const item = await db.storeItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (!item.isAvailable) {
      return { success: false, error: "Item is not available" };
    }

    if (item.quantity < quantity) {
      return { success: false, error: "Insufficient quantity available" };
    }

    // Create purchase record and update item quantity in a transaction
    const [purchase] = await db.$transaction([
      db.studentPurchase.create({
        data: {
          itemId,
          studentId,
          quantity,
          totalPrice: item.price * quantity,
          status: 'PENDING'
        }
      }),
      db.storeItem.update({
        where: { id: itemId },
        data: {
          quantity: item.quantity - quantity
        }
      })
    ]);

    revalidatePath("/dashboard/storefront");
    return { success: true, data: purchase };
  } catch (error) {
    console.error("Purchase store item error:", error);
    return { success: false, error: "Failed to process purchase" };
  }
}