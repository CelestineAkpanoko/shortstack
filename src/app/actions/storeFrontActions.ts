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
  message?: string;
}

// Create a new store item
export async function createStoreItem(
  formData: FormData
): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }
    
    const data: CreateStoreItemData = {
      name: formData.get("name") as string,
      emoji: (formData.get("emoji") as string) || "🛍️",
      price: parseFloat(formData.get("price") as string),
      description: formData.get("description") as string,
      quantity: parseInt(formData.get("quantity") as string, 10) || 0,
      isAvailable: formData.get("isAvailable") === "true",
    };

    // Get class IDs - now supporting multiple classes
    const classIds = formData.getAll("classIds") as string[];

    // Validate required fields
    if (!data.name || isNaN(data.price)) {
      return { success: false, error: "Missing required fields" };
    }

    if (!classIds.length) {
      return { success: false, error: "At least one class must be selected" };
    }

    // Verify that all classes belong to this user
    const classes = await db.class.findMany({
      where: {
        id: { in: classIds },
        userId: userId
      }
    });

    // If any class doesn't belong to this user or doesn't exist
    if (classes.length !== classIds.length) {
      return { success: false, error: "One or more selected classes are invalid" };
    }

    // Create the store item with class assignments
    const newItem = await db.storeItem.create({
      data: {
        ...data,
        class: {
          connect: classIds.map(id => ({ id }))
        }
      },
      include: {
        class: true
      }
    });

    revalidatePath("/dashboard/storefront");
    return { success: true, data: newItem };
  } catch (error) {
    console.error("Create store item error:", error);
    return { success: false, error: "Failed to create store item" };
  }
}

// Get store items across all classes for the current user
export async function getAllStoreItems(filters?: {
  classId?: string;
}): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    // All store items must be associated with a class owned by this user
    let whereClause: any = {
      class: {
        some: {
          userId: userId
        }
      }
    };

    // Add class filter if provided
    if (filters?.classId) {
      whereClause = {
        class: {
          some: { 
            id: filters.classId,
            userId
          }
        }
      };
    }

    const items = await db.storeItem.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            emoji: true,
            code: true,
          },
        },
        purchases: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching store items:", error);
    return { success: false, error: "Failed to fetch store items" };
  }
}

// Get a single Store Item - ensure it belongs to the user
export async function getStoreItem(storeItemId: string): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "User not found" };
    }

    const storeItem = await db.storeItem.findFirst({
      where: {
        id: storeItemId,
        class: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            emoji: true,
            code: true,
          },
        },
        purchases: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        }
      },
    });

    if (!storeItem) {
      return { success: false, error: "Store item not found or doesn't belong to you" };
    }

    return { success: true, data: storeItem };
  } catch (error) {
    console.error("Error fetching store item:", error);
    return { success: false, error: "Failed to fetch store item details" };
  }
}

// Get all store items for the current user
export async function getStoreItems(classId?: string): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    // All store items must be associated with a class owned by this user
    let whereClause: any = {
      class: {
        some: {
          userId
        }
      }
    };

    // Add class filter if provided
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
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            emoji: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Get store items error:", error);
    return { success: false, error: "Failed to fetch store items" };
  }
}

interface CopyStoreItemToClassParams {
  storeItemId: string;
  targetClassIds: string[];
}

// Copy a store item to multiple classes
export async function copyStoreItemToClasses({
  storeItemId,
  targetClassIds
}: CopyStoreItemToClassParams): Promise<StoreItemResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authorized" };
    }

    // 1. Verify the item exists and belongs to this user
    const originalItem = await db.storeItem.findFirst({
      where: {
        id: storeItemId,
        class: {
          some: {
            userId
          }
        }
      },
      include: {
        class: true
      }
    });

    if (!originalItem) {
      return { success: false, error: "Store item not found or doesn't belong to you" };
    }

    // 2. Verify all target classes belong to this user
    const targetClasses = await db.class.findMany({
      where: {
        id: { in: targetClassIds },
        userId
      }
    });

    if (targetClasses.length !== targetClassIds.length) {
      return { success: false, error: "One or more target classes are invalid" };
    }

    // 3. Check which classes the item is already assigned to
    const existingClassIds = originalItem.class.map(cls => cls.id);
    
    // Filter out classes that already have this item
    const newClassIds = targetClassIds.filter(id => !existingClassIds.includes(id));
    
    if (newClassIds.length === 0) {
      return { success: false, error: "Item is already assigned to all selected classes" };
    }

    // 4. Update the store item to add the new class connections
    const updatedItem = await db.storeItem.update({
      where: { id: storeItemId },
      data: {
        class: {
          connect: newClassIds.map(id => ({ id }))
        }
      },
      include: {
        class: true
      }
    });

    revalidatePath("/dashboard/storefront");
    revalidatePath("/dashboard/classes");
    
    return { 
      success: true,
      message: `Item assigned to ${newClassIds.length} additional ${newClassIds.length === 1 ? 'class' : 'classes'}`,
      data: updatedItem
    };
  } catch (error) {
    console.error("Copy store item error:", error);
    return { success: false, error: "Failed to assign store item to classes" };
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
      data,
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
      where: { id },
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
      where: { id: itemId },
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
          status: "PENDING",
        },
      }),
      db.storeItem.update({
        where: { id: itemId },
        data: {
          quantity: item.quantity - quantity,
        },
      }),
    ]);

    revalidatePath("/dashboard/storefront");
    return { success: true, data: purchase };
  } catch (error) {
    console.error("Purchase store item error:", error);
    return { success: false, error: "Failed to process purchase" };
  }
}
