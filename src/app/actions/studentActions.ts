'use server';

import { db } from "@/src/lib/db";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/src/lib/auth";
import * as bcrypt from 'bcryptjs';
import { sendStudentInvitation } from "@/src/lib/email";
import { generateAccountNumber } from "@/src/lib/utils";
import { setupBankAccountsForStudent } from "@/src/lib/banking";

// Utility function to generate random passwords
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Get all students in a class with enrollment counts
export async function getStudentsByClass(classCode: string) {
  console.log("Server action getStudentsByClass called with code:", classCode);
  
  try {
    const session = await getAuthSession();
    
    // Handle missing or invalid session
    if (!session?.user?.id) {
      console.error("Unauthorized: No user session");
      return { success: false, error: "Unauthorized: Please log in" };
    }
    
    if (session.user.role !== "TEACHER") {
      console.error("Unauthorized: Not a teacher role");
      return { success: false, error: "Unauthorized: Teacher access required" };
    }

    if (!classCode) {
      console.error("Missing classCode parameter");
      return { success: false, error: "Class code is required" };
    }

    // Find the class by code
    const classData = await db.class.findUnique({ 
      where: { code: classCode },
      select: { 
        id: true, 
        userId: true 
      }
    });
    
    if (!classData) {
      console.error(`Class not found with code: ${classCode}`);
      return { success: false, error: "Class not found" };
    }
    
    // Verify the teacher owns this class
    if (classData.userId !== session.user.id) {
      console.error("Access denied: Teacher doesn't own this class");
      return { success: false, error: "You don't have permission to access this class" };
    }

    // Get students enrolled in the class
    const enrollments = await db.enrollment.findMany({
      where: { classId: classData.id },
      include: { student: true }
    });

    // Transform the data for the UI
    const students = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      firstName: enrollment.student.firstName,
      lastName: enrollment.student.lastName,
      schoolEmail: enrollment.student.schoolEmail,
      progress: enrollment.student.progress || 0,
      enrolled: enrollment.enrolled
    }));

    // Calculate enrollment stats
    const enrollmentStats = {
      total: enrollments.length,
      enrolled: enrollments.filter(e => e.enrolled).length
    };

    console.log(`Found ${students.length} students for class ${classCode}`);
    
    return {
      success: true,
      data: {
        students,
        enrollmentStats
      }
    };
  } catch (error) {
    console.error("Get students error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch students" 
    };
  }
}

// Create a new student and enroll them in a class
export async function createStudent(formData: FormData, classCode: string) {
  try {
    console.log("Starting createStudent with class code:", classCode);
    
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Extract and validate fields
    const firstName = formData.get('firstName')?.toString().trim() || "";
    const lastName = formData.get('lastName')?.toString().trim() || "";
    const schoolEmail = formData.get('schoolEmail')?.toString().trim() || "";
    const password = formData.get('password')?.toString().trim() || "";
    const generatePasswordValue = formData.get('generatePassword');
    const generateTemporaryPassword = generatePasswordValue === 'true';

    if (!firstName || !lastName || !schoolEmail) {
      return { success: false, error: "Missing required fields" };
    }

    // Find the class by code
    const classData = await db.class.findUnique({ 
      where: { code: classCode } 
    });
    
    if (!classData) {
      console.error(`Class not found with code: ${classCode}`);
      return { success: false, error: "Class not found" };
    }
    
    // Check if the student already exists
    let student = await db.student.findUnique({ where: { schoolEmail } });
    
    // If student exists, check if they're already in this class
    if (student) {
      const existingEnrollment = await db.enrollment.findUnique({
        where: { 
          studentId_classId: { 
            studentId: student.id, 
            classId: classData.id 
          } 
        }
      });
      
      if (existingEnrollment) {
        return { success: false, error: "Student already enrolled in this class" };
      }
    }
    
    let finalPassword = password;
    if (generateTemporaryPassword) {
      finalPassword = generateRandomPassword();
    } else if (!password && !student) {
      return { success: false, error: "Password is required for new students" };
    }

    // If student doesn't exist, create them
    if (!student) {
      const hashedPassword = await bcrypt.hash(finalPassword, 10);
      
      try {
        // IMPORTANT: Using classCode here, not classData.id
        student = await db.student.create({
          data: {
            firstName,
            lastName,
            schoolEmail,
            password: hashedPassword,
            progress: 0,
            classId: classCode, // Using classCode directly as per your schema
            teacherId: session.user.name ?? "" // Associate with the teacher, fallback to an empty string
          }
        });
        console.log("Student created with ID:", student.id);
      } catch (createError) {
        console.error("Error creating student:", createError);
        return { 
          success: false, 
          error: "Failed to create student: " + (createError instanceof Error ? createError.message : "Unknown error") 
        };
      }
    }

    // Now create the enrollment - this needs classData.id
    try {
      const enrollment = await db.enrollment.create({
        data: {
          studentId: student.id,
          classId: classData.id, // This uses ID as per your schema
          enrolled: false  // Not fully enrolled until the student logs in and joins
        }
      });

      console.log("Enrollment created successfully");
    } catch (enrollError) {
      console.error("Error creating enrollment:", enrollError);
      // Continue with the process even if enrollment fails
    }

    // Send invitation email with appropriate message based on whether student is new or existing
    const isNewStudent = student.createdAt > new Date(Date.now() - 5000); // Created within last 5 seconds
    try {
      await sendStudentInvitation({
        to: schoolEmail,
        subject: `Your Class Invitation for ${classData.name}`,
        text: isNewStudent 
          ? `Hello ${firstName} ${lastName},

You have been added to ${classData.name} by your teacher.
Use the following credentials to log in:

Email: ${schoolEmail}
Password: ${finalPassword}
Class Code: ${classCode}

Please log in and join the class using the provided code.`
          : `Hello ${firstName} ${lastName},

You have been added to a new class: ${classData.name}.
Use your existing login credentials to access the class.

Class Code: ${classCode}

Please log in and join the class using the provided code.`
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Continue with enrollment even if email fails
      // But return a warning to the UI
      revalidatePath(`/teacher/dashboard/classes/${classCode}`);
      return { 
        success: true, 
        data: { student, enrollment: true },
        warning: "Student was added but the invitation email couldn't be sent. Please provide login details manually."
      };
    }

    revalidatePath(`/teacher/dashboard/classes/${classCode}`);
    return { success: true, data: { student, enrollment: true } };

  } catch (error: any) {
    console.error("Create student error:", error);
    return { success: false, error: error.message || "Failed to create student" };
  }
}

// Add an existing student to a class
export async function addExistingStudentToClass(studentId: string, classCode: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Find the class by code
    const classData = await db.class.findUnique({ 
      where: { code: classCode },
      select: { 
        id: true, 
        userId: true,
        name: true,
        emoji: true
      }
    });
    
    if (!classData) {
      return { success: false, error: "Class not found" };
    }
    
    // Verify the teacher owns this class
    if (classData.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to access this class" };
    }

    // Check that the student exists
    const student = await db.student.findUnique({ 
      where: { 
        id: studentId,
        teacherId: session.user.id // Ensure the student belongs to this teacher
      }
    });
    
    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Prevent duplicate enrollment - important check
    const existingEnrollment = await db.enrollment.findUnique({
      where: { 
        studentId_classId: { 
          studentId: student.id, 
          classId: classData.id 
        } 
      }
    });
    
    if (existingEnrollment) {
      return { success: false, error: "Student already enrolled in this class" };
    }

    // Create the enrollment
    const enrollment = await db.enrollment.create({
      data: {
        studentId: student.id,
        classId: classData.id,
        enrolled: false
      }
    });

    // Send notification email to the student
    try {
      await sendStudentInvitation({
        to: student.schoolEmail,
        subject: `You've Been Added to ${classData.name}`,
        text: `Hello ${student.firstName} ${student.lastName},

You have been added to a new class: ${classData.name}.
Use your existing login credentials to access the class.

Class Code: ${classCode}

Please log in and join the class using the provided code.`
      });
    } catch (emailError) {
      console.error("Failed to send class addition email:", emailError);
      // Continue even if email fails
      // Return warning in response
      revalidatePath(`/dashboard/classes/${classCode}`);
      return { 
        success: true, 
        data: enrollment,
        warning: "Student was added but the notification email couldn't be sent. Please notify them manually."
      };
    }

    revalidatePath(`/dashboard/classes/${classCode}`);
    return { success: true, data: enrollment };

  } catch (error: any) {
    console.error("Add existing student error:", error);
    return { success: false, error: "Failed to add student to class" };
  }
}

// Get all available students not yet enrolled in the specified class
export async function getAvailableStudents(classCode: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    const classData = await db.class.findUnique({ 
      where: { code: classCode },
      select: { id: true, userId: true }
    });
    
    if (!classData) {
      return { success: false, error: "Class not found" };
    }
    
    // Verify the teacher owns this class
    if (classData.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to access this class" };
    }

    // Get the IDs of students already enrolled in the class
    const enrolledStudentIds = await db.enrollment.findMany({
      where: { classId: classData.id },
      select: { studentId: true }
    }).then(enrollments => enrollments.map(e => e.studentId));

    // Return students not in the list of enrolled IDs
    const students = await db.student.findMany({
      where: {
        id: { notIn: enrolledStudentIds },
        teacherId: session.user.id // Only find students created by this teacher
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        schoolEmail: true
      },
      orderBy: { firstName: 'asc' }
    });

    return { success: true, data: students };

  } catch (error) {
    console.error("Get available students error:", error);
    return { success: false, error: "Failed to fetch available students" };
  }
}

// Student joining a class: update the enrollment record to mark as enrolled
export async function joinClass(classCode: string, studentId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Find the class by code
    const classData = await db.class.findUnique({ where: { code: classCode } });
    if (!classData) return { success: false, error: "Invalid class code" };

    // Verify student ID belongs to the current user 
    const student = await db.student.findUnique({
      where: { 
        id: studentId,
        userId: session.user.id // Only allow joining if student belongs to this user
      }
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Find the enrollment
    let enrollment = await db.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId: classData.id
        }
      }
    });

    if (!enrollment) {
      // Create new enrollment if it doesn't exist
      enrollment = await db.enrollment.create({
        data: {
          studentId,
          classId: classData.id,
          enrolled: true
        }
      });
    } else if (!enrollment.enrolled) {
      // Update enrollment to enrolled
      enrollment = await db.enrollment.update({
        where: { id: enrollment.id },
        data: { enrolled: true }
      });
    }

    return { 
      success: true, 
      data: {
        className: classData.name,
        emoji: classData.emoji,
        enrolled: true
      }
    };
  } catch (error) {
    console.error("Join class error:", error);
    return { success: false, error: "Failed to join class" };
  }
}

// Update student data
export async function updateStudent(formData: FormData, classCode: string, studentId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Find the class by code
    const classData = await db.class.findUnique({ 
      where: { code: classCode },
      select: { id: true, userId: true }
    });
    
    if (!classData) {
      return { success: false, error: "Class not found" };
    }
    
    // Verify the teacher owns this class
    if (classData.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to access this class" };
    }

    // Extract fields from form data
    const firstName = formData.get('firstName')?.toString().trim();
    const lastName = formData.get('lastName')?.toString().trim();
    const schoolEmail = formData.get('schoolEmail')?.toString().trim();
    
    // Validate fields
    if (!firstName || !lastName || !schoolEmail) {
      return { success: false, error: "Missing required fields" };
    }
    
    // Check if email is already taken by another student
    const existingStudent = await db.student.findFirst({
      where: {
        schoolEmail,
        NOT: { id: studentId }
      }
    });
    
    if (existingStudent) {
      return { success: false, error: "Email is already in use by another student" };
    }
    
    // Update the student
    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: {
        firstName,
        lastName,
        schoolEmail,
      }
    });
    
    revalidatePath(`/dashboard/classes/${classCode}`);
    return { success: true, data: updatedStudent };
  } catch (error) {
    console.error("Update student error:", error);
    return { success: false, error: "Failed to update student" };
  }
}

// Delete a student with options to remove from class or delete completely
export async function deleteStudent(
  classCode: string, 
  studentId: string, 
  options: { removeFromClassOnly: boolean } = { removeFromClassOnly: true }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Find the class by code
    const classData = await db.class.findUnique({ 
      where: { code: classCode },
      select: { id: true, userId: true }
    });
    
    if (!classData) {
      return { success: false, error: "Class not found" };
    }
    
    // Verify the teacher owns this class
    if (classData.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to access this class" };
    }

    // Find the enrollment to delete
    const enrollment = await db.enrollment.findFirst({
      where: { 
        studentId: studentId,
        classId: classData.id
      }
    });

    if (!enrollment) {
      return { success: false, error: "Student not enrolled in this class" };
    }

    console.log(`Deleting student ${studentId} with options:`, options);
    
    // Handle full deletion first if requested
    if (!options.removeFromClassOnly) {
      console.log("Attempting complete student deletion");
      
      try {
        // First delete all enrollments for this student (to avoid FK constraints)
        const deleteEnrollments = await db.enrollment.deleteMany({
          where: { studentId: studentId }
        });
        
        console.log(`Deleted ${deleteEnrollments.count} enrollments`);
        
        // Now delete the student record
        await db.student.delete({
          where: { id: studentId }
        });
        
        console.log("Student completely deleted");
        
        revalidatePath(`/dashboard/classes/${classCode}`);
        return { 
          success: true, 
          message: "Student has been completely deleted from the system"
        };
      } catch (error) {
        console.error("Failed to fully delete student:", error);
        
        // If full deletion fails, fall back to removing from just this class
        try {
          // Try to at least remove from this specific class
          await db.enrollment.delete({
            where: { id: enrollment.id }
          });
          
          revalidatePath(`/dashboard/classes/${classCode}`);
          return { 
            success: true, 
            message: "Student could not be fully deleted, but was removed from this class",
            warning: true
          };
        } catch (fallbackError) {
          console.error("Even class removal failed:", fallbackError);
          return { success: false, error: "Failed to remove student from class" };
        }
      }
    } else {
      // Just remove from this class
      console.log("Removing student from class only");
      
      try {
        await db.enrollment.delete({
          where: { id: enrollment.id }
        });
        
        console.log("Student removed from class");
        
        revalidatePath(`/dashboard/classes/${classCode}`);
        return { 
          success: true, 
          message: "Student has been removed from this class"
        };
      } catch (error) {
        console.error("Failed to remove student from class:", error);
        return { success: false, error: "Failed to remove student from class" };
      }
    }
  } catch (error) {
    console.error("Delete student error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete student"
    };
  }
}

// Create bank accounts for a student when they are enrolled
export async function createStudentBankAccounts(studentId: string) {
  try {
    const result = await setupBankAccountsForStudent(studentId);
    
    if (result.success) {
      revalidatePath("/dashboard/bank");
      return { success: true, data: result.data };
    } else {
      return { success: false, error: "An unknown error occurred while creating bank accounts" };
    }
  } catch (error) {
    console.error("Error creating bank accounts:", error);
    return { success: false, error: "Failed to create bank accounts" };
  }
}