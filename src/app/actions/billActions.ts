"use server";

import { db } from "@/src/lib/db";
import { getAuthSession } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { BillFrequency, BillStatus } from "@prisma/client"; // Import enums

// Define types
interface CreateBillData {
  title: string;
  emoji?: string;
  amount: number;
  dueDate: Date;
  description?: string;
  frequency: BillFrequency;
}

interface BillResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// Add this interface to define params
interface RemoveBillFromClassesParams {
  billId: string;
  classIds: string[]; // Empty array means remove from all classes
}

// Create Bill with class selection
export async function createBill(formData: FormData): Promise<BillResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    const data: CreateBillData = {
      title: formData.get("title") as string,
      emoji: (formData.get("emoji") as string) ?? "💰",
      amount: parseFloat(formData.get("amount") as string),
      dueDate: new Date(formData.get("dueDate") as string),
      description: formData.get("description") as string,
      frequency: formData.get("frequency") as BillFrequency,
    };

    // Get class IDs - now required
    const classIds = formData.getAll("classIds") as string[];

    // Validate required fields
    if (!data.title || !data.amount || !data.dueDate || !data.frequency) {
      return { success: false, error: "Missing required fields" };
    }

    if (!classIds.length) {
      return { success: false, error: "At least one class must be selected" };
    }

    // Verify that all classes belong to this user
    const classes = await db.class.findMany({
      where: {
        id: { in: classIds },
        userId: session.user.id
      }
    });

    // If any class doesn't belong to this user or doesn't exist
    if (classes.length !== classIds.length) {
      return { success: false, error: "One or more selected classes are invalid" };
    }

    // Create one bill with multiple class connections and link to creator
    const newBill = await db.bill.create({
      data: {
        ...data,
        creatorId: session.user.id, // Track who created the bill
        class: {
          connect: classIds.map(id => ({ id }))
        }
      },
      include: {
        class: true
      }
    });

    // Create StudentBill records for all students in the selected classes
    const students = await db.student.findMany({
      where: {
        classId: { in: classIds }
      }
    });

    if (students.length > 0) {
      await db.studentBill.createMany({
        data: students.map(student => ({
          billId: newBill.id,
          studentId: student.id,
          amount: newBill.amount, // Set the full bill amount
          paidAmount: 0, // Initialize with zero paid
          isPaid: false,
          dueDate: newBill.dueDate // Copy the due date from the bill
        }))
      });
    }

    revalidatePath("/teacher/dashboard/bills");
    return { success: true, data: newBill };
  } catch (error) {
    console.error("Create bill error:", error);
    return { success: false, error: "Failed to create bill" };
  }
}

// Get Bills - filter by user's classes or created by user
export async function getBills(filters?: {
  classId?: string;
  includeUnassigned?: boolean; // Add option to include bills not assigned to any class
}): Promise<BillResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Different logic based on user role
    if (session.user.role === "TEACHER") {
      // Get all classes owned by this teacher
      const userClasses = await db.class.findMany({
        where: { userId: session.user.id },
        select: { id: true }
      });
      
      const userClassIds = userClasses.map(c => c.id);
      
      // Create the where condition based on class IDs
      let whereCondition: any = {};
      
      if (filters?.classId) {
        // Filter bills for a specific class
        whereCondition = {
          AND: [
            { creatorId: session.user.id }, // Always filter by creator
            {
              class: {
                some: {
                  id: filters.classId
                }
              }
            }
          ]
        };
      } else {
        // Always include bills created by this user regardless of class assignment
        whereCondition = {
          creatorId: session.user.id
        };
        
        // If not including unassigned bills, add class filter
        if (!filters?.includeUnassigned) {
          whereCondition.class = {
            some: {
              id: {
                in: userClassIds
              }
            }
          };
        }
      }

      const bills = await db.bill.findMany({
        where: whereCondition,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              emoji: true,
              code: true,
            }
          },
          studentBills: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: bills };
    } 
    else if (session.user.role === "STUDENT") {
      // Students should only see bills for classes they're enrolled in
      const student = await db.student.findUnique({
        where: { userId: session.user.id }
      });
      
      if (!student) {
        return { success: false, error: "Student profile not found" };
      }
      
      // Get enrolled class IDs
      const enrollments = await db.enrollment.findMany({
        where: {
          studentId: student.id,
          enrolled: true
        },
        select: { classId: true }
      });
      
      const enrolledClassIds = enrollments.map(e => e.classId);
      
      // Filter bills
      let whereClause: any = {};
      
      if (filters?.classId) {
        // Verify student is enrolled in this specific class
        if (!enrolledClassIds.includes(filters.classId)) {
          return { success: false, error: "Not enrolled in this class" };
        }
        
        whereClause = {
          classes: {
            some: { id: filters.classId }
          }
        };
      } else {
        whereClause = {
          classes: {
            some: {
              id: { in: enrolledClassIds }
            }
          }
        };
      }
      
      const bills = await db.bill.findMany({
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
          studentBills: {
            where: { studentId: student.id },
            include: { student: true }
          }
        },
        orderBy: { dueDate: "asc" },
      });
      
      return { success: true, data: bills };
    }
    
    return { success: false, error: "Unknown user role" };
  } catch (error) {
    console.error("Error fetching bills:", error);
    return { success: false, error: "Failed to fetch bill details" };
  }
}

// Get a single Bill
export async function getBill(billId: string): Promise<BillResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (session.user.role === "TEACHER") {
      // Fetch bill either created by this user OR assigned to their classes
      const bill = await db.bill.findFirst({
        where: {
          id: billId,
          OR: [
            { creatorId: session.user.id }, // Created by this user
            {
              class: {
                some: {
                  userId: session.user.id // Or in one of their classes
                }
              }
            }
          ]
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
          studentBills: {
            include: {
              student: {
                include: {
                  class: {
                    select: {
                      id: true,
                      name: true,
                      emoji: true,
                    }
                  }
                }
              }
            }
          }
        },
      });

      if (!bill) {
        return { success: false, error: "Bill not found or you don't have permission to view it" };
      }
      
      // Transform the bill with students property for easier access in UI
      const transformedBill = {
        ...bill,
        students: bill.studentBills.map(sb => ({
          studentId: sb.studentId,
          billId: sb.billId,
          isPaid: sb.isPaid,
          paidAt: sb.paidAt,
          student: sb.student
        }))
      };

      return { success: true, data: transformedBill };
    } 
    else if (session.user.role === "STUDENT") {
      // Handle student role access
      // ... existing student code ...
    }
    
    return { success: false, error: "Unknown user role" };
  } catch (error) {
    console.error("Error fetching bill:", error);
    return { success: false, error: "Failed to fetch bill details" };
  }
}

// Update Bill (Teacher only)
export async function updateBill(billId: string, data: Partial<CreateBillData>): Promise<BillResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the bill belongs to this user - either as creator or assigned to their class
    const billExists = await db.bill.findFirst({
      where: {
        id: billId,
        OR: [
          { creatorId: session.user.id }, // Bill creator
          {
            class: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      }
    });

    if (!billExists) {
      return { success: false, error: "Bill not found or doesn't belong to you" };
    }

    const updateData: any = {
      title: data.title,
      amount: data.amount,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      description: data.description,
      frequency: data.frequency,
    };

    const bill = await db.bill.update({
      where: { id: billId },
      data: updateData
    });

    revalidatePath('/teacher/dashboard/bills');
    return { success: true, data: bill };
  } catch (error: any) {
    console.error("Update bill error:", error?.message || "Unknown error");
    return { success: false, error: "Failed to update bill" };
  }
}

// Copy bill to additional classes
interface CopyBillToClassParams {
  billId: string;
  targetClassIds: string[];
}

export async function copyBillToClasses({
  billId,
  targetClassIds
}: CopyBillToClassParams): Promise<BillResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // 1. Verify the bill exists and belongs to this user
    const originalBill = await db.bill.findFirst({
      where: {
        id: billId,
        OR: [
          { creatorId: session.user.id }, // Bill creator
          {
            class: {
              some: {
                userId: session.user.id // Assigned to one of their classes
              }
            }
          }
        ]
      },
      include: {
        class: true
      }
    });

    if (!originalBill) {
      return { success: false, error: "Bill not found or doesn't belong to you" };
    }

    // 2. Verify all target classes belong to this user
    const targetClasses = await db.class.findMany({
      where: {
        id: { in: targetClassIds },
        userId: session.user.id
      }
    });

    if (targetClasses.length !== targetClassIds.length) {
      return { success: false, error: "One or more target classes are invalid" };
    }

    // 3. Check which classes the bill is already assigned to
    const existingClassIds = originalBill.class.map(cls => cls.id);
    
    // Filter out classes that already have this bill
    const newClassIds = targetClassIds.filter(id => !existingClassIds.includes(id));
    
    if (newClassIds.length === 0) {
      return { success: false, error: "Bill is already assigned to all selected classes" };
    }

    // 4. Update the bill to add the new class connections
    const updatedBill = await db.bill.update({
      where: { id: billId },
      data: {
        class: {
          connect: newClassIds.map(id => ({ id }))
        }
      },
      include: {
        class: true
      }
    });

    // 5. Get all students from the new classes
    const students = await db.student.findMany({
      where: {
        classId: { in: newClassIds }
      }
    });

    // 6. Create StudentBill records for each student in the new classes
    if (students.length > 0) {
      // First check which students already have this bill assigned
      const existingStudentBills = await db.studentBill.findMany({
        where: { billId }
      });
      
      const existingStudentIds = existingStudentBills.map(sb => sb.studentId);
      
      // Only create records for students who don't already have this bill
      const newStudentBills = students
        .filter(student => !existingStudentIds.includes(student.id))
        .map(student => ({
          billId,
          studentId: student.id,
          amount: originalBill.amount, // Set the full bill amount
          paidAmount: 0, // Initialize with zero paid
          isPaid: false,
          dueDate: originalBill.dueDate // Copy the due date from the bill
        }));
        
      if (newStudentBills.length > 0) {
        await db.studentBill.createMany({
          data: newStudentBills
        });
      }
    }

    revalidatePath("/teacher/dashboard/bills");
    revalidatePath("/teacher/dashboard/classes");
    
    return { 
      success: true, 
      data: updatedBill,
      message: `Bill successfully assigned to ${newClassIds.length} additional class(es)` 
    };
  } catch (error) {
    console.error("Error copying bill to classes:", error);
    return { success: false, error: "Failed to assign bill to additional classes" };
  }
}

// Remove bill from specific classes (or all)
export async function removeBillFromClasses({
  billId,
  classIds
}: RemoveBillFromClassesParams): Promise<BillResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the bill belongs to this user
    const bill = await db.bill.findFirst({
      where: {
        id: billId,
        creatorId: session.user.id // Only creator can remove the bill from classes
      },
      include: {
        class: true
      }
    });

    if (!bill) {
      return { success: false, error: "Bill not found or you don't have permission" };
    }

    // If empty classIds array, disconnect from all classes
    if (classIds.length === 0) {
      // Get all classes currently associated with this bill
      const currentClassIds = bill.class.map(c => ({ id: c.id }));
      
      // Update the bill to disconnect from all classes
      await db.bill.update({
        where: { id: billId },
        data: {
          class: {
            disconnect: currentClassIds
          }
        }
      });
      
      // Delete StudentBill records for all classes since no longer assigned
      await db.studentBill.deleteMany({
        where: { billId }
      });
      
      revalidatePath("/teacher/dashboard/bills");
      revalidatePath("/teacher/dashboard/classes");
      
      return { 
        success: true, 
        message: "Bill unassigned from all classes but still available in your account" 
      };
    } else {
      // Remove bill from specific classes
      
      // Verify all classIds are valid
      const validClassIds = bill.class
        .filter(c => classIds.includes(c.id))
        .map(c => ({ id: c.id }));
      
      if (validClassIds.length !== classIds.length) {
        return { success: false, error: "One or more classes are not assigned this bill" };
      }
      
      // Update bill to disconnect from specified classes
      await db.bill.update({
        where: { id: billId },
        data: {
          class: {
            disconnect: validClassIds
          }
        }
      });
      
      // Remove student bills for the students in these classes
      // First get students from the specified classes
      const studentsInClasses = await db.student.findMany({
        where: {
          classId: { in: classIds }
        },
        select: { id: true }
      });
      
      const studentIds = studentsInClasses.map(s => s.id);
      
      // Then delete StudentBill records for these students
      if (studentIds.length > 0) {
        await db.studentBill.deleteMany({
          where: {
            billId,
            studentId: { in: studentIds }
          }
        });
      }
      
      revalidatePath("/teacher/dashboard/bills");
      revalidatePath("/teacher/dashboard/classes");
      
      return { 
        success: true, 
        message: `Bill unassigned from ${validClassIds.length} class(es)` 
      };
    }
  } catch (error) {
    console.error("Error removing bill from classes:", error);
    return { success: false, error: "Failed to unassign bill from classes" };
  }
}

// Delete Bill (only creator can fully delete)
export async function deleteBill(id: string): Promise<BillResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the bill was created by this user
    const bill = await db.bill.findFirst({
      where: {
        id: id,
        creatorId: session.user.id
      }
    });

    if (!bill) {
      return { success: false, error: "Bill not found or you don't have permission to delete it" };
    }

    // Delete the bill if it belongs to this user
    await db.bill.delete({
      where: { id },
    });

    revalidatePath("/teacher/dashboard/bills");
    return { success: true };
  } catch (error) {
    console.error("Error deleting bill:", error);
    return { success: false, error: "Failed to delete bill" };
  }
}

// Update Payment Status (Teacher only)
export async function updatePaymentStatus(
  billId: string,
  studentId: string,
  isPaid: boolean
): Promise<BillResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the bill belongs to this user and the student is in one of their classes
    const billAndStudent = await db.bill.findFirst({
      where: {
        id: billId,
        class: {
          some: {
            userId: session.user.id,
            students: {
              some: {
                id: studentId
              }
            }
          }
        }
      }
    });

    if (!billAndStudent) {
      return { success: false, error: "Bill or student not found, or doesn't belong to your classes" };
    }

    const updatedStudentBill = await db.studentBill.update({
      where: {
        billId_studentId: {
          billId,
          studentId,
        },
      },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : null,
      },
    });

    revalidatePath("/teacher/dashboard/bills");
    return { success: true, data: updatedStudentBill };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return { success: false, error: "Failed to update payment status" };
  }
}