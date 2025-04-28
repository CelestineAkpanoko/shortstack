'use server';

import { db } from "@/src/lib/db";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/src/lib/auth";
import { Prisma } from "@prisma/client";

// Types
interface ClassData {
  name: string;
  emoji: string;
  cadence?: string;
  day?: string;
  time?: string;
  grade?: string;
}

interface ClassResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const generateUniqueClassCode = async (userId: string): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 6;

  while (true) {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }
    
    // Check uniqueness only for the current user's classes
    const existingClass = await db.class.findFirst({
      where: { 
        AND: [
          { code },
          { userId }
        ]
      }
    });

    if (!existingClass) {
      return code;
    }
  }
};

// Create class
export async function createClass(formData: FormData): Promise<ClassResponse> {
  try {
    console.log("Starting class creation...");
    
    // Use NextAuth session
    const session = await getAuthSession();
    console.log("Session data:", session?.user?.id, session?.user?.role);
    
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      console.log("Auth failed:", !session?.user?.id ? "No user ID" : "Not a teacher");
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    
    // Get form data
    const name = formData.get('name') as string;
    const emoji = formData.get('emoji') as string;
    const cadence = formData.get('cadence') as string || "Weekly";
    const day = formData.get('day') as string || "monday";
    const time = formData.get('time') as string || "09:00";
    const grade = formData.get('grade') as string || "9th";
    
    console.log("Form data:", { name, emoji, cadence, day, time, grade });
    
    // Verify all required fields are present
    if (!name || !emoji) {
      return { success: false, error: "Missing required fields" };
    }

    // Generate unique code for this user
    const code = await generateUniqueClassCode(userId);
    console.log("Generated class code:", code);
    
    const newClass = await db.class.create({
      data: {
        name,
        emoji,
        code,
        cadence,
        day,
        time,
        grade,
        userId
      }
    });

    console.log("Class created successfully:", newClass);

    // Update revalidation paths
    revalidatePath('/teacher/dashboard/classes', 'page');
    revalidatePath('/teacher/dashboard', 'page');
    return { success: true, data: newClass };
  } catch (error: any) {
    console.error("Create class error - DETAILED:", error);
    console.error(error.stack); // Add stack trace
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: "Failed to generate a unique class code. Please try again." };
    }
    
    return { success: false, error: `Failed to create class: ${error.message}` };
  }
}

// Get classes (for the logged-in user: teacher's classes or student's enrolled classes)
export async function getClasses(): Promise<ClassResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    let classes;
    if (session.user.role === "TEACHER") {
      classes = await db.class.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { enrollments: { where: { enrolled: true } } } } // Count enrolled students
        }
      });
    } else if (session.user.role === "STUDENT") {
      classes = await db.class.findMany({
        where: {
          enrollments: {
            some: {
              student: { userId: session.user.id },
              enrolled: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        include: {
          user: { select: { name: true, firstName: true, lastName: true } } // Include teacher name
        }
      });
    } else {
      return { success: false, error: "Invalid user role" };
    }

    return { success: true, data: classes };
  } catch (error: any) {
    console.error("Get classes error:", error);
    return { success: false, error: "Failed to fetch classes" };
  }
}

// Get Class By ID (ensure user has access)
export const getClassByID = async (id: string): Promise<ClassResponse> => {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const classData = await db.class.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
        enrollments: {
          where: { enrolled: true },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, schoolEmail: true, profileImage: true }
            }
          },
          orderBy: { student: { lastName: 'asc' } }
        },
        lessonPlans: { orderBy: { createdAt: 'asc' } },
        bills: { orderBy: { dueDate: 'asc' } },
        storeItems: { orderBy: { name: 'asc' } },
      }
    });

    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    // Authorization check
    if (session.user.role === "TEACHER" && classData.userId !== session.user.id) {
      return { success: false, error: "Forbidden: You do not own this class" };
    } else if (session.user.role === "STUDENT") {
      const isEnrolled = await db.enrollment.findFirst({
        where: {
          classId: id,
          student: { userId: session.user.id },
          enrolled: true
        }
      });
      
      if (!isEnrolled) {
        return { success: false, error: "Forbidden: Not enrolled in this class" };
      }
    }

    return { success: true, data: classData };
  } catch (error: any) {
    console.error("Get class by ID error:", error);
    return { success: false, error: "Failed to fetch class data" };
  }
}

// Update class (only teacher owner)
export async function updateClass(id: string, data: ClassData): Promise<ClassResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify teacher owns the class
    const classToUpdate = await db.class.findUnique({
      where: { id },
      select: { userId: true, code: true }
    });

    if (!classToUpdate || classToUpdate.userId !== session.user.id) {
      return { success: false, error: "Class not found or access denied" };
    }

    const validUpdateData: any = {};
    
    if (data.name) validUpdateData.name = data.name;
    if (data.emoji) validUpdateData.emoji = data.emoji;
    if (data.cadence) validUpdateData.cadence = data.cadence;
    if (data.day) validUpdateData.day = data.day;
    if (data.time) validUpdateData.time = data.time;
    if (data.grade) validUpdateData.grade = data.grade;

    const updatedClass = await db.class.update({
      where: { id },
      data: validUpdateData,
    });

    revalidatePath(`/teacher/dashboard/classes/${classToUpdate.code}`);
    revalidatePath("/teacher/dashboard/classes");
    return { success: true, data: updatedClass };
  } catch (error: any) {
    console.error("Update class error:", error);
    return { success: false, error: "Failed to update class" };
  }
}

// Delete class (only teacher owner)
export async function deleteClass(id: string): Promise<ClassResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify teacher owns the class
    const classToDelete = await db.class.findUnique({
      where: { id },
      select: { userId: true, code: true }
    });

    if (!classToDelete || classToDelete.userId !== session.user.id) {
      return { success: false, error: "Class not found or access denied" };
    }

    await db.class.delete({
      where: { id }
    });

    revalidatePath("/teacher/dashboard/classes");
    return { success: true };
  } catch (error: any) {
    console.error("Delete class error:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return { success: false, error: "Cannot delete class: It has related records that couldn't be automatically deleted. Please remove them first." };
      }
      if (error.code === 'P2025') {
        return { success: false, error: "Class not found" };
      }
    }
    
    return { success: false, error: "Failed to delete class" };
  }
}

// Get class data by class code - optimized version
export async function getClassData(classCode: string): Promise<ClassResponse> {
  try {
    console.log(`Getting class data for code: ${classCode}`);
    
    const session = await getAuthSession();
    if (!session?.user?.id) {
      console.log("No authenticated user");
      return { success: false, error: "Unauthorized" };
    }
    
    const userId = session.user.id;
    const isStudent = session.user.role === "STUDENT";
    const isTeacher = session.user.role === "TEACHER";
    
    console.log(`User role: ${session.user.role}, User ID: ${userId}`);

    // Find the class first
    const classExists = await db.class.findUnique({
      where: { code: classCode },
      select: { id: true, userId: true }
    });

    if (!classExists) {
      console.log(`Class not found with code: ${classCode}`);
      return { success: false, error: "Class not found" };
    }

    // Determine if the user has access to this class
    let hasAccess = false;

    if (isTeacher && classExists.userId === userId) {
      // Teacher owns the class
      hasAccess = true;
      console.log("Teacher is the owner of this class");
    } else if (isStudent) {
      // For students, the userId in the session IS the studentId
      // This is a critical difference - students don't have separate User records
      
      const enrollment = await db.enrollment.findFirst({
        where: {
          classId: classExists.id,
          studentId: userId, // Use the session userId directly as studentId
          enrolled: true
        }
      });
      
      hasAccess = !!enrollment;
      console.log(`Student enrollment check: ${hasAccess ? "Enrolled" : "Not enrolled"}`);
      
      if (!hasAccess) {
        // For debugging, check if the student record exists
        const student = await db.student.findUnique({
          where: { id: userId }
        });
        
        if (!student) {
          console.log(`No student record found with ID: ${userId}`);
          return { success: false, error: "Student record not found" };
        } else {
          console.log(`Student exists (${student.firstName} ${student.lastName}) but not enrolled in class`);
        }
        
        // Also check all enrollments for this class
        const classEnrollments = await db.enrollment.findMany({
          where: {
            classId: classExists.id,
            enrolled: true
          },
          include: {
            student: true
          }
        });
        
        console.log(`Class has ${classEnrollments.length} enrollments:`);
        classEnrollments.forEach(e => {
          console.log(`- Student: ${e.student.firstName} ${e.student.lastName} (ID: ${e.studentId})`);
        });
      }
    }

    if (!hasAccess) {
      console.log("User does not have access to this class");
      return { success: false, error: "Forbidden: You do not have access to this class" };
    }

    // Fetch full class data now that we know user has access
    const classData = await db.class.findUnique({
      where: { id: classExists.id },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            firstName: true, 
            lastName: true, 
            email: true,
            image: true 
          } 
        },
        _count: { 
          select: { 
            enrollments: { where: { enrolled: true } } 
          } 
        },
        lessonPlans: { 
          orderBy: { createdAt: 'asc' },
          include: {
            files: true,
            assignmentRelations: true,
          }
        }
      }
    });

    // For backwards compatibility, map assignmentRelations to assignments
    // in the response data structure
    if (classData && classData.lessonPlans) {
      classData.lessonPlans = classData.lessonPlans.map(plan => ({
        ...plan,
        assignments: plan.assignmentRelations
      }));
    }

    console.log("Successfully retrieved class data");
    return { success: true, data: classData };
  } catch (error: any) {
    console.error("Get class data by code error:", error);
    return { success: false, error: "Failed to fetch class data: " + error.message };
  }
}

// Test database connection - for debugging
export async function testDbConnection(): Promise<ClassResponse> {
  try {
    const count = await db.class.count();
    return { 
      success: true, 
      data: { message: "Database connection successful", count } 
    };
  } catch (error: any) {
    console.error("Database connection error:", error);
    return { 
      success: false, 
      error: `Database connection failed: ${error.message}` 
    };
  }
}