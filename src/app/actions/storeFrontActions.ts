"use server";

import { db } from "@/src/lib/db";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/src/lib/auth"; // Import NextAuth session helper

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

interface CopyStoreItemToClassParams {
  storeItemId: string;
  targetClassIds: string[];
}

// Create a new store item
export async function createStoreItem(
  formData: FormData
): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession(); // Use NextAuth session
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    const data: CreateStoreItemData = {
      name: formData.get("name") as string,
      emoji: (formData.get("emoji") as string) || "🛍️",
      price: parseFloat(formData.get("price") as string),
      description: formData.get("description") as string,
      quantity: parseInt(formData.get("quantity") as string, 10) || 0,
      isAvailable: formData.get("isAvailable") === "true",
    };

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
        userId: session.user.id, // Use session.user.id from NextAuth
      },
    });

    if (classes.length !== classIds.length) {
      return { success: false, error: "One or more selected classes are invalid" };
    }

    // Create the store item with class assignments
    const newItem = await db.storeItem.create({
      data: {
        ...data,
        classId: classIds[0], // Track who created the item
        class: {
          connect: classIds.map((id) => ({ id })), // Connect to the selected classes
        },
      },
      include: {
        class: true,
      },
    });

    revalidatePath("/dashboard/storefront");
    return { success: true, data: newItem };
  } catch (error) {
    console.error("Create store item error:", error);
    return { success: false, error: "Failed to create store item" };
  }
}

// Get all store items for the current user
export async function getAllStoreItems(filters?: {
  classId?: string;
}): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession(); // Use NextAuth session
    if (!session?.user?.id) {
      return { success: false, error: "Not authorized" };
    }

    // Validate filters.classId
    if (filters?.classId && typeof filters.classId !== "string") {
      return { success: false, error: "Invalid classId filter" };
    }

    let whereClause: any = {
      class: {
        some: {
          userId: session.user.id, // Use session.user.id from NextAuth
        },
      },
    };

    if (filters?.classId) {
      whereClause = {
        class: {
          some: {
            id: filters.classId,
            userId: session.user.id,
          },
        },
      };
    }

    // Debugging logs
    console.log("Filters:", filters);
    console.log("Where Clause:", whereClause);

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
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
    const session = await getAuthSession(); // Use NextAuth session
    if (!session?.user?.id) {
      return { success: false, error: "User not found" };
    }

    const storeItem = await db.storeItem.findFirst({
      where: {
        id: storeItemId,
        class: {
          some: {
            userId: session.user.id, // Use session.user.id from NextAuth
          },
        },
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
                profileImage: true,
              },
            },
          },
        },
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

// Copy a store item to multiple classes
export async function copyStoreItemToClasses({
  storeItemId,
  targetClassIds,
}: CopyStoreItemToClassParams): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession(); // Use NextAuth session
    if (!session?.user?.id) {
      return { success: false, error: "Not authorized" };
    }

    const originalItem = await db.storeItem.findFirst({
      where: {
        id: storeItemId,
        class: {
          some: {
            userId: session.user.id, // Use session.user.id from NextAuth
          },
        },
      },
      include: {
        class: true,
      },
    });

    if (!originalItem) {
      return { success: false, error: "Store item not found or doesn't belong to you" };
    }

    const targetClasses = await db.class.findMany({
      where: {
        id: { in: targetClassIds },
        userId: session.user.id, // Use session.user.id from NextAuth
      },
    });

    if (targetClasses.length !== targetClassIds.length) {
      return { success: false, error: "One or more target classes are invalid" };
    }

    const existingClassIds = originalItem.class.map((cls) => cls.id);
    const newClassIds = targetClassIds.filter((id) => !existingClassIds.includes(id));

    if (newClassIds.length === 0) {
      return { success: false, error: "Item is already assigned to all selected classes" };
    }

    const updatedItem = await db.storeItem.update({
      where: { id: storeItemId },
      data: {
        class: {
          connect: newClassIds.map((id) => ({ id })),
        },
      },
      include: {
        class: true,
      },
    });

    revalidatePath("/dashboard/storefront");
    revalidatePath("/dashboard/classes");

    return {
      success: true,
      message: `Item assigned to ${newClassIds.length} additional ${
        newClassIds.length === 1 ? "class" : "classes"
      }`,
      data: updatedItem,
    };
  } catch (error) {
    console.error("Copy store item error:", error);
    return { success: false, error: "Failed to assign store item to classes" };
  }
}

// Delete Store Item (only teacher who owns the class can delete)
export async function deleteStoreItem(storeItemId: string): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verificar que el item pertenece a una clase de este profesor
    const storeItem = await db.storeItem.findFirst({
      where: {
        id: storeItemId,
        class: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!storeItem) {
      return { success: false, error: "Store item not found or you don't have permission to delete it" };
    }

    // Eliminar el item si pertenece a una clase del profesor
    await db.storeItem.delete({
      where: { id: storeItemId },
    });

    revalidatePath("/dashboard/storefront");
    revalidatePath("/dashboard/classes");
    return { success: true, message: "Store item deleted successfully" };
  } catch (error) {
    console.error("Error deleting store item:", error);
    return { success: false, error: "Failed to delete store item" };
  }
}