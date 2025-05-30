'use server';

import { db } from "@/src/lib/db";
import { getAuthSession } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

interface GradebookResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Get gradebook data for a class
export async function getClassGradebook(classCode: string): Promise<GradebookResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the class exists and the user has access
    const classData = await db.class.findUnique({
      where: { code: classCode },
      select: { id: true, userId: true }
    });

    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    // Authorization check
    if (session.user.role === "TEACHER" && classData.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to access this class" };
    }

    // Get all students in the class
    const students = await db.student.findMany({
      where: {
        enrollments: {
          some: {
            classId: classData.id,
            enrolled: true
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true
      },
      orderBy: { lastName: 'asc' }
    });

    // Get all assignments for the class
    const assignments = await db.assignment.findMany({
      where: { classId: classCode },
      select: {
        id: true,
        name: true,
        fileType: true,
        dueDate: true
      },
      orderBy: { dueDate: 'asc' }
    });

    // Get all submissions for the students and assignments
    const submissions = await db.studentAssignmentSubmission.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        assignmentId: { in: assignments.map(a => a.id) }
      },
      select: {
        id: true,
        studentId: true,
        assignmentId: true,
        grade: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      success: true,
      data: {
        students,
        assignments,
        submissions
      }
    };
  } catch (error: any) {
    console.error("Get gradebook error:", error);
    return { success: false, error: "Failed to fetch gradebook data" };
  }
}

// Update grade for a student's assignment submission
export async function updateAssignmentGrade(
  studentId: string,
  assignmentId: string,
  grade: number
): Promise<GradebookResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized" };
    }

    // Find the submission
    const submission = await db.studentAssignmentSubmission.findFirst({
      where: {
        studentId,
        assignmentId
      },
      include: {
        assignment: {
          select: {
            classId: true
          }
        }
      }
    });

    // Get the class to verify ownership
    let classCode: string;
    
    if (submission) {
      classCode = submission.assignment.classId;
    } else {
      // If no submission exists yet, get the class from the assignment
      const assignment = await db.assignment.findUnique({
        where: { id: assignmentId },
        select: { classId: true }
      });
      
      if (!assignment) {
        return { success: false, error: "Assignment not found" };
      }
      
      classCode = assignment.classId;
    }

    // Verify class ownership
    const classData = await db.class.findUnique({
      where: { code: classCode },
      select: { userId: true }
    });

    if (!classData || classData.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to grade this assignment" };
    }

    // Validate grade
    if (grade < 0 || grade > 100) {
      return { success: false, error: "Grade must be between 0 and 100" };
    }

    let updatedSubmission;

    if (submission) {
      // Update existing submission
      updatedSubmission = await db.studentAssignmentSubmission.update({
        where: { id: submission.id },
        data: {
          grade,
          status: "GRADED"
        }
      });
    } else {
      // Create new submission if it doesn't exist
      updatedSubmission = await db.studentAssignmentSubmission.create({
        data: {
          studentId,
          assignmentId,
          grade,
          status: "GRADED",
          textContent: "Added by teacher"
        }
      });
    }

    // Revalidate the class page
    revalidatePath(`/teacher/dashboard/classes/${classCode}`);

    return {
      success: true,
      data: updatedSubmission
    };
  } catch (error: any) {
    console.error("Update grade error:", error);
    return { success: false, error: "Failed to update grade" };
  }
}

// Get grades for a specific student in a class
export async function getStudentGrades(classCode: string): Promise<GradebookResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
       return { success: false, error: 'Unauthorized: Students only' };
    }

    // Find the student profile ID
    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          ...(session.user.email ? [{ schoolEmail: session.user.email }] : []),
          { id: session.user.id }
        ]
      }
    });
    
    if (!student) {
      return { success: false, error: 'Student profile not found' };
    }

    // Verify the student is enrolled in this class
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId: student.id,
        class: { code: classCode },
        enrolled: true
      },
      select: { classId: true }
    });

    if (!enrollment) {
       return { success: false, error: 'Not enrolled in this class or class not found' };
    }

    // Get all assignments for the class
    const assignments = await db.assignment.findMany({
      where: { classId: classCode },
      select: {
        id: true,
        name: true,
        fileType: true,
        dueDate: true,
      },
      orderBy: { dueDate: 'asc' }
    });

    // Get all submissions for this student in this class
    const submissions = await db.studentAssignmentSubmission.findMany({
      where: {
        studentId: student.id,
        assignmentId: { in: assignments.map(a => a.id) }
      },
      include: {
        assignment: {
          select: {
            id: true,
            name: true,
            fileType: true,
            dueDate: true
          }
        }
      }
    });

    return {
      success: true,
      data: {
        assignments,
        submissions
      }
    };
  } catch (error: any) {
    console.error("Get student grades error:", error);
    return { success: false, error: "Failed to fetch grades data" };
  }
}

// Get student progress across ALL enrolled classes
export async function getStudentOverallProgress(): Promise<GradebookResponse> {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
       return { success: false, error: 'Unauthorized: Students only' };
    }

    // Find the student profile ID
    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          ...(session.user.email ? [{ schoolEmail: session.user.email }] : []),
          { id: session.user.id }
        ]
      }
    });
    
    if (!student) {
      return { success: false, error: 'Student profile not found' };
    }

    // Get all classes the student is enrolled in
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: student.id,
        enrolled: true
      },
      include: {
        class: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    // Use class codes for assignment lookup
    const classCodes = enrollments.map(e => e.class.code);

    // Get all assignments across all enrolled classes
    const assignments = await db.assignment.findMany({
      where: { 
        classId: { in: classCodes }
      },
      select: {
        id: true,
        name: true,
        classId: true,
        dueDate: true
      }
    });

    // Get all submissions for this student across all classes
    const submissions = await db.studentAssignmentSubmission.findMany({
      where: {
        studentId: student.id,
        assignmentId: { in: assignments.map(a => a.id) }
      },
      select: {
        id: true,
        assignmentId: true,
        grade: true,
        status: true,
        createdAt: true
      }
    });

    // Calculate progress statistics
    const totalAssignments = assignments.length;
    const completedAssignments = submissions.filter(s => 
      s.status === 'SUBMITTED' || s.status === 'GRADED'
    ).length;
    
    const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    const totalPoints = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
    
    // Calculate averages and other metrics
    const averageGrade = gradedSubmissions.length > 0 
      ? Math.round(totalPoints / gradedSubmissions.length) 
      : 0;

    // ✅ NEW: Get actual bank account balances
    let totalBankBalance = 0;
    try {
      const bankAccounts = await db.bankAccount.findMany({
        where: {
          studentId: student.id
        },
        select: {
          balance: true,
          accountType: true
        }
      });

      // Sum all account balances (checking + savings)
      totalBankBalance = bankAccounts.reduce((sum, account) => {
        return sum + (account.balance || 0);
      }, 0);

    } catch (bankError) {
      console.error("Error fetching bank balance:", bankError);
      // Fall back to points-based calculation if bank fetch fails
      totalBankBalance = totalPoints;
    }

    // Mock streak calculation
    const streak = Math.min(completedAssignments * 2, 30);

    // Progress summary for dashboard
    const progressSummary = {
      completedAssignments,
      totalAssignments,
      points: totalPoints,
      balance: totalBankBalance, // ✅ Use real bank balance
      streak,
      averageGrade,
      gradedCount: gradedSubmissions.length
    };

    return {
      success: true,
      data: {
        progress: progressSummary,
        assignments,
        submissions,
        enrolledClasses: classCodes.length
      }
    };
  } catch (error: any) {
    console.error("Get student overall progress error:", error);
    return { success: false, error: "Failed to fetch progress data" };
  }
}