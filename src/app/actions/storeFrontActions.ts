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

export async function getStoreItem(storeItemId: string): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "User not found" };
    }

    // Get the store item with all related data
    const item = await db.storeItem.findFirst({
      where: {
        id: storeItemId, 
        class: {
          some: {
            userId: session.user.id, // Ensure teacher owns the class
          },
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            emoji: true,
            userId: true,
          },
        },
        purchases: {
          select: {
            id: true,
            quantity: true,
            totalPrice: true,
            status: true,
            purchasedAt: true,
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
          orderBy: {
            purchasedAt: 'desc'
          }
        },
      },
    });

    if (!item) {
      return { success: false, error: "Store item not found or you don't have permission to view it" };
    }

    // Transform the data to match your component interface
    const transformedItem = {
      ...item,
      classes: item.class, // Rename 'class' to 'classes' to match your interface
    };

    return { success: true, data: transformedItem };
  } catch (error: any) {
    console.error("Get store item error:", error);
    return { success: false, error: "Failed to fetch store item" };
  }
}

// Copy a store item to multiple classes
export async function copyStoreItemToClasses({
  storeItemId,
  targetClassIds,
}: CopyStoreItemToClassParams): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the original store item exists and user owns it
    const originalItem = await db.storeItem.findFirst({
      where: { 
        id: storeItemId, 
        class: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: { 
        class: { 
          select: { 
            id: true,
            userId: true, 
            code: true 
          } 
        } 
      }
    });

    if (!originalItem || !originalItem.class.some(cls => cls.userId === session.user.id)) {
      return { success: false, error: "Store item not found or you don't have permission" };
    }

    // Verify that all target classes belong to this teacher
    const targetClasses = await db.class.findMany({
      where: {
        id: { in: targetClassIds },
        userId: session.user.id,
      },
    });

    if (targetClasses.length !== targetClassIds.length) {
      return { success: false, error: "One or more selected classes are invalid" };
    }

    // Get classes that the item is already assigned to
    const currentClassIds = originalItem.class.map(cls => cls.id);
    
    // Filter out classes that already have this item
    const newClassIds = targetClassIds.filter(classId => !currentClassIds.includes(classId));
    
    if (newClassIds.length === 0) {
      return { success: false, error: "Store item is already assigned to all selected classes" };
    }

    // Connect the store item to the new classes
    await db.storeItem.update({
      where: { id: storeItemId }, 
      data: {
        class: {
          connect: newClassIds.map(classId => ({ id: classId }))
        }
      }
    });

    // Revalidate paths for all affected classes
    [...currentClassIds, ...newClassIds].forEach(classId => {
      const classCode = [...originalItem.class, ...targetClasses].find(cls => cls.id === classId)?.code;
      if (classCode) {
        revalidatePath(`/teacher/dashboard/classes/${classCode}/store`);
      }
    });
    revalidatePath("/teacher/dashboard/storefront");

    return { 
      success: true, 
      message: `Store item assigned to ${newClassIds.length} additional class(es)` 
    };
  } catch (error: any) {
    console.error("Copy store item error:", error);
    return { success: false, error: "Failed to assign store item to classes" };
  }
}

// Get store items available to a student
export async function getStudentStoreItems(): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authorized" };
    }

    // Get the student profile
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { success: false, error: "Student profile not found" };
    }

    // Get the classes the student is enrolled in
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: student.id,
        enrolled: true
      },
      select: {
        classId: true
      }
    });

    const classIds = enrollments.map(enrollment => enrollment.classId);

    if (classIds.length === 0) {
      // Student isn't enrolled in any classes
      return { success: true, data: [] };
    }

    // Get available store items from those classes
    const storeItems = await db.storeItem.findMany({
      where: {
        isAvailable: true,
        quantity: { gt: 0 },
        class: {
          some: {
            id: { in: classIds }
          }
        }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            emoji: true
          }
        }
      }
    });

    return { success: true, data: storeItems };
  } catch (error) {
    console.error("Error fetching student store items:", error);
    return { success: false, error: "Failed to fetch store items" };
  }
}

// Student purchases a store item
export async function purchaseStoreItem(itemId: string, quantity: number): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authorized" };
    }

    // Get the student profile
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return { success: false, error: "Student profile not found" };
    }

    // Verify the item exists and is available
    const storeItem = await db.storeItem.findUnique({
      where: { id: itemId },
    });

    if (!storeItem) {
      return { success: false, error: "Item not found" };
    }

    if (!storeItem.isAvailable) {
      return { success: false, error: "This item is not available for purchase" };
    }

    if (storeItem.quantity < quantity) {
      return { success: false, error: "Not enough items in stock" };
    }

    // Calculate total price
    const totalPrice = storeItem.price * quantity;

    // Create the purchase record
    const purchase = await db.studentPurchase.create({
      data: {
        itemId: storeItem.id,
        studentId: student.id,
        quantity,
        totalPrice,
        status: "PENDING",
      },
    });

    // Update the item quantity
    await db.storeItem.update({
      where: { id: itemId },
      data: {
        quantity: {
          decrement: quantity
        }
      }
    });

    revalidatePath("/student/dashboard/storefront");
    revalidatePath("/teacher/dashboard/storefront");

    return { 
      success: true, 
      message: "Item purchased successfully",
      data: purchase 
    };
  } catch (error) {
    console.error("Error purchasing store item:", error);
    return { success: false, error: "Failed to purchase item" };
  }
}

// Delete Store Item (only teacher who owns the class can delete)
export async function deleteStoreItem(storeItemId: string): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify teacher owns the class associated with the item
    const item = await db.storeItem.findFirst({
      where: { 
        id: storeItemId, 
        class: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: { class: { select: { userId: true, code: true } } }
    });

    if (!item || !item.class.some(cls => cls.userId === session.user.id)) {
      return { success: false, error: "Forbidden or Item not found" };
    }

    // Delete associated purchases first (or use cascade delete)
    await db.studentPurchase.deleteMany({ 
      where: { 
        itemId: storeItemId 
      } 
    });

    await db.storeItem.delete({ where: { id: storeItemId } }); 

    // Revalidate paths
    item.class.forEach(cls => {
      revalidatePath(`/teacher/dashboard/classes/${cls.code}/store`);
    });
    revalidatePath("/teacher/dashboard/storefront");
    
    return { success: true };
  } catch (error: any) {
    console.error("Delete store item error:", error);
    return { success: false, error: "Failed to delete store item" };
  }
}

// Update an existing store item
export async function updateStoreItem(
  storeItemId: string,
  data: UpdateStoreItemData
): Promise<StoreItemResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify teacher owns the class associated with the item
    const item = await db.storeItem.findFirst({
      where: { 
        id: storeItemId, 
        class: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: { class: { select: { userId: true, code: true } } }
    });

    if (!item || !item.class.some(cls => cls.userId === session.user.id)) {
      return { success: false, error: "Forbidden or Item not found" };
    }

    const updatedItem = await db.storeItem.update({
      where: { id: storeItemId },
      data,
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
              }
            }
          },
        },
      },
    });

    // Revalidate paths
    updatedItem.class.forEach(cls => {
      revalidatePath(`/teacher/dashboard/classes/${cls.code}/store`);
    });
    revalidatePath("/teacher/dashboard/storefront");
    
    return { success: true, data: updatedItem };
  } catch (error: any) {
    console.error("Update store item error:", error);
    return { success: false, error: "Failed to update store item" };
  }
}