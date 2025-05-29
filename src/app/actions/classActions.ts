'use server';

import { db } from "@/src/lib/db";
import { getAuthSession } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from '@prisma/client';

// Types
interface ClassSchedule {
  days: number[]; // 0-6 for days of week
  startTime: string; // e.g., "09:00" - format needed for ClassSession
  endTime: string; // e.g., "11:00" - format needed for ClassSession
}

interface ClassData {
  name: string;
  emoji: string;
  cadence?: string;
  grade?: string;
  color?: string;
  startDate?: Date; // Add startDate field
  endDate?: Date;   // Add endDate field
  schedule?: ClassSchedule;
}

interface ClassResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper function to generate a unique class code
async function generateUniqueClassCode(userId: string): Promise<string> {
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
}

// Create recurring calendar events for class sessions
async function createClassScheduleEvents(classData: any, schedules: any[]) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      console.log("No session for calendar event creation");
      return;
    }
    
    // Create calendar events for each schedule
    for (const schedule of schedules) {
      // Ensure days is an array of numbers
      const days: number[] = Array.isArray(schedule.days)
        ? schedule.days.map((day: string | number) => typeof day === 'string' ? parseInt(day, 10) : day)
        : [];
      
      if (days.length === 0) {
        console.log("No days specified for this schedule");
        continue;
      }
      
      // Create a single recurring event with all selected days
      const eventTitle = `${classData.emoji} ${classData.name} Class`;
      
      // Convert start/end times to proper date objects
      const startHour = parseInt(schedule.startTime.split(':')[0]);
      const startMinute = parseInt(schedule.startTime.split(':')[1]);
      const endHour = parseInt(schedule.endTime.split(':')[0]);
      const endMinute = parseInt(schedule.endTime.split(':')[1]);
      
      const startDate = new Date();
      startDate.setHours(startHour, startMinute, 0, 0);
      
      const endDate = new Date();
      endDate.setHours(endHour, endMinute, 0, 0);
      
      // Create one calendar event with all recurring days
      const calendarEvent = await db.calendarEvent.create({
        data: {
          title: eventTitle,
          description: `Regular class session for ${classData.name}`,
          startDate: startDate,
          endDate: endDate,
          variant: classData.color || "primary",
          isRecurring: true,
          recurringDays: days, // Ensure these are numbers (0-6)
          createdById: session.user.id,
          classId: classData.id,
        }
      });
      
      // Create class session records - ensure dayOfWeek is a number
      for (const day of days) {
        await db.classSession.create({
          data: {
            dayOfWeek: day, // Store as number (0-6)
            startTime: schedule.startTime, // Store as string (HH:MM)
            endTime: schedule.endTime, // Store as string (HH:MM)
            classId: classData.id
          }
        });
      }
      
      console.log(`Created recurring calendar event for class ${classData.name} with days: ${days.join(', ')}`);
    }
  } catch (error) {
    console.error("Error creating class schedule events:", error);
  }
}

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
    
    // Get form data with validation
    const name = formData.get('name') as string;
    const emoji = formData.get('emoji') as string;
    const cadence = formData.get('cadence') as string || "Weekly";
    const grade = formData.get('grade') as string || "9th";
    
    // Validate color choice
    const rawColor = formData.get('color') as string || "primary";
    const validColors = ["primary", "secondary", "destructive", "success", "warning", "default"];
    const color = validColors.includes(rawColor) ? rawColor : "primary";
    
    // Get class date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    
    if (startDateStr) {
      startDate = new Date(startDateStr);
    }
    
    if (endDateStr) {
      endDate = new Date(endDateStr);
    }
    
    // Get schedules from JSON
    const schedulesJson = formData.get('schedules') as string;
    const schedules = schedulesJson ? JSON.parse(schedulesJson) : [];
    
    // Ensure schedules have proper numeric days
    if (schedules.length > 0) {
      schedules.forEach((schedule: any) => {
        if (schedule.days) {
          schedule.days = schedule.days.map((day: any) => 
            typeof day === 'string' ? parseInt(day, 10) : day
          );
        }
      });
    }
    
    console.log("Form data:", { name, emoji, cadence, grade, color, startDate, endDate, schedules });
    
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
        color, // Use validated color
        grade,
        startDate, // Include startDate
        endDate,   // Include endDate
        userId
      }
    });

    console.log("Class created successfully:", newClass);

    // Create class sessions and calendar events
    if (schedules && schedules.length > 0) {
      await createClassScheduleEvents(newClass, schedules);
    }

    // Update revalidation paths
    revalidatePath('/teacher/dashboard/classes', 'page');
    revalidatePath('/teacher/dashboard', 'page');

    return { success: true, data: newClass };
  } catch (error: any) {
    console.error("Create class error - DETAILED:", error);
    console.error(error.stack);
    
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
          classSessions: true, // Include class sessions to access schedule info
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
          classSessions: true, // Include class sessions to access schedule info
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
        classSessions: true, // Include class sessions
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
// Update class (only teacher owner)
export async function updateClass(id: string, data: any): Promise<ClassResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    const existingClass = await db.class.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existingClass || existingClass.userId !== session.user.id) {
      return { success: false, error: "Class not found or you don't have permission to update it" };
    }

    // Ensure color is validated before updating
    const validColor = ["primary", "secondary", "destructive", "success", "warning", "default"].includes(data.color || "") 
      ? data.color 
      : "primary";

    // Update class with clean data
    const updatedClass = await db.class.update({
      where: { id },
      data: {
        name: data.name,
        emoji: data.emoji,
        cadence: data.cadence,
        grade: data.grade,
        color: validColor,
        startDate: data.startDate,
        endDate: data.endDate
      }
    });

    // Delete existing sessions
    await db.classSession.deleteMany({
      where: { classId: id }
    });
    
    // Delete existing recurring calendar events
    await db.calendarEvent.deleteMany({
      where: { 
        classId: id,
        isRecurring: true
      }
    });

    // Process each schedule
    if (data.schedules && data.schedules.length > 0) {
      for (const schedule of data.schedules) {
        // Ensure days are numeric (0-6)
        const dayNumbers = schedule.days.map((day: any) => 
          typeof day === "string" ? parseInt(day, 10) : day
        );
        
        if (dayNumbers.length === 0) continue;

        // Create class session records for this time slot
        for (const day of dayNumbers) {
          await db.classSession.create({
            data: {
              classId: id,
              dayOfWeek: day,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            }
          });
        }
        
        // Create calendar event for this time slot
        const eventTitle = `${data.emoji} ${data.name} Class`;
        
        // Convert start/end times to proper date objects
        const startHour = parseInt(schedule.startTime.split(':')[0]);
        const startMinute = parseInt(schedule.startTime.split(':')[1]);
        const endHour = parseInt(schedule.endTime.split(':')[0]);
        const endMinute = parseInt(schedule.endTime.split(':')[1]);
        
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);
        
        const endDate = new Date();
        endDate.setHours(endHour, endMinute, 0, 0);
        
        await db.calendarEvent.create({
          data: {
            title: eventTitle,
            description: `Regular class session for ${data.name}`,
            startDate: startDate,
            endDate: endDate,
            variant: validColor,
            isRecurring: true,
            recurringDays: dayNumbers,
            createdById: session.user.id,
            classId: id,
          }
        });
      }
    }

    // Ensure revalidation is immediate and covers all necessary paths
    revalidatePath('/teacher/dashboard/classes', 'layout');
    revalidatePath('/teacher/dashboard', 'layout');
    
    return { success: true, data: updatedClass };
  } catch (error: any) {
    console.error("Update class error:", error);
    return { success: false, error: `Failed to update class: ${error.message}` };
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

    // Delete associated calendar events first
    await db.calendarEvent.deleteMany({
      where: { classId: id }
    });

    // Then delete the class
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

// Get class data by class code
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
    } else if (isStudent) {
      // Check enrollment for student
      const enrollment = await db.enrollment.findFirst({
        where: {
          classId: classExists.id,
          studentId: userId,
          enrolled: true
        }
      });
      
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      console.log("User does not have access to this class");
      return { success: false, error: "Forbidden: You do not have access to this class" };
    }

    // Fetch full class data now that we know user has access
    const classData = await db.class.findUnique({
      where: { id: classExists.id },
      include: {
        classSessions: true, // Include class sessions
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