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

    // Get teacher record
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return { success: false, error: "Teacher profile not found" };
    }

    // Verify the class exists and belongs to the teacher
    const classData = await db.class.findFirst({
      where: { 
        code: classCode,
        teacherId: teacher.id
      },
      select: { id: true }
    });

    if (!classData) {
      return { success: false, error: "Class not found or you don't have permission to access it" };
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

    // Get all assignments for the class using many-to-many relationship
    const assignments = await db.assignment.findMany({
      where: { 
        OR: [
          // Direct class assignments
          {
            classes: {
              some: {
                id: classData.id
              }
            }
          },
          // Assignments through lesson plans
          {
            lessonPlans: {
              some: {
                classes: {
                  some: {
                    id: classData.id
                  }
                }
              }
            }
          }
        ]
      },
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

    // Get teacher record
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return { success: false, error: "Teacher profile not found" };
    }

    // Find the submission
    const submission = await db.studentAssignmentSubmission.findFirst({
      where: {
        studentId,
        assignmentId
      },
      include: {
        assignment: {
          include: {
            classes: {
              select: {
                id: true,
                code: true,
                teacherId: true
              }
            }
          }
        }
      }
    });

    // Get assignment and verify teacher ownership
    let assignment;
    if (submission) {
      assignment = submission.assignment;
    } else {
      assignment = await db.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          classes: {
            select: {
              id: true,
              code: true,
              teacherId: true
            }
          }
        }
      });
    }

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Verify teacher owns the assignment
    if (assignment.teacherId !== teacher.id) {
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

    // Revalidate the class page using the first class code
    if (assignment.classes.length > 0) {
      revalidatePath(`/teacher/dashboard/classes/${assignment.classes[0].code}`);
    }

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
          ...(session.user.email ? [{ schoolEmail: session.user.email }] : [])
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

    // Get all assignments for the class using many-to-many relationship
    const allAssignments = await db.assignment.findMany({
      where: { 
        OR: [
          // Direct class assignments
          {
            classes: {
              some: {
                id: enrollment.classId
              }
            }
          },
          // Assignments through lesson plans that are specifically assigned to this class
          {
            lessonPlans: {
              some: {
                classes: {
                  some: {
                    id: enrollment.classId
                  }
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        fileType: true,
        dueDate: true,
        classes: {
          where: {
            id: enrollment.classId
          },
          select: {
            id: true
          }
        },
        lessonPlans: {
          where: {
            classes: {
              some: {
                id: enrollment.classId
              }
            }
          },
          select: {
            id: true,
            classes: {
              where: {
                id: enrollment.classId
              },
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Filter to ensure assignments are actually connected to this specific class
    const assignments = allAssignments.filter(assignment => {
      const isDirectlyConnected = assignment.classes.length > 0;
      const isConnectedThroughLessonPlan = assignment.lessonPlans.some(lp => lp.classes.length > 0);
      return isDirectlyConnected || isConnectedThroughLessonPlan;
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
          ...(session.user.email ? [{ schoolEmail: session.user.email }] : [])
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

    // Get class IDs for assignment lookup
    const classIds = enrollments.map(e => e.class.id);

    // Get all assignments across all enrolled classes using many-to-many relationship
    const allAssignments = await db.assignment.findMany({
      where: { 
        OR: [
          // Direct class assignments - only for enrolled classes
          {
            classes: {
              some: {
                id: { in: classIds }
              }
            }
          },
          // Assignments through lesson plans - only for lesson plans assigned to enrolled classes
          {
            lessonPlans: {
              some: {
                classes: {
                  some: {
                    id: { in: classIds }
                  }
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        dueDate: true,
        classes: {
          where: {
            id: { in: classIds }
          },
          select: {
            id: true,
            code: true
          }
        },
        lessonPlans: {
          where: {
            classes: {
              some: {
                id: { in: classIds }
              }
            }
          },
          select: {
            id: true,
            name: true,
            classes: {
              where: {
                id: { in: classIds }
              },
              select: {
                id: true,
                code: true
              }
            }
          }
        }
      }
    });

    // Remove duplicates manually since distinct might not work as expected
    // Also filter to ensure assignments are actually connected to the student's enrolled classes
    const assignments = allAssignments.filter((assignment, index, self) => {
      // Remove duplicates
      const isUnique = index === self.findIndex(a => a.id === assignment.id);
      if (!isUnique) return false;

      // Check if assignment is connected to any of the student's enrolled classes
      const isConnectedToEnrolledClass = 
        assignment.classes.some(cls => classIds.includes(cls.id)) ||
        assignment.lessonPlans.some(lp => 
          lp.classes.some(cls => classIds.includes(cls.id))
        );

      return isConnectedToEnrolledClass;
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
    
    // Count unique assignments that have been submitted (not duplicate submissions)
    const uniqueSubmittedAssignments = new Set(
      submissions
        .filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED')
        .map(s => s.assignmentId)
    );
    const completedAssignments = uniqueSubmittedAssignments.size;
    
    const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    
    // Calculate average grade instead of total points
    const averageGrade = gradedSubmissions.length > 0 
      ? Math.round(gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / gradedSubmissions.length)
      : 0;

    // Debug logging
    console.log('Student Progress Debug:', {
      studentId: student.id,
      enrolledClasses: classIds.length,
      totalAssignments,
      totalSubmissions: submissions.length,
      completedAssignments,
      gradedSubmissions: gradedSubmissions.length,
      averageGrade
    });

    // Get actual bank account balances
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
      // Fall back to 0 if bank fetch fails
      totalBankBalance = 0;
    }

    // Mock streak calculation
    const streak = Math.min(completedAssignments * 2, 30);

    // Progress summary for dashboard - use averageGrade instead of points
    const progressSummary = {
      completedAssignments,
      totalAssignments,
      points: averageGrade, // Changed: now represents average grade instead of total points
      balance: totalBankBalance,
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
        enrolledClasses: classIds.length
      }
    };
  } catch (error: any) {
    console.error("Get student overall progress error:", error);
    return { success: false, error: "Failed to fetch progress data" };
  }
}

// Get performance data for all teacher's classes (for histogram)
export async function getTeacherClassesPerformance(): Promise<GradebookResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get teacher record
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return { success: false, error: "Teacher profile not found" };
    }

    // Get all teacher's classes with students and assignments
    const classes = await db.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        enrollments: {
          where: { enrolled: true },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        assignments: {
          select: {
            id: true,
            name: true
          }
        },
        lessonPlans: {
          include: {
            assignments: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Get all submissions for all students in all classes
    const allStudentIds = classes.flatMap(cls => 
      cls.enrollments.map(enrollment => enrollment.student.id)
    );
    
    // Get all assignment IDs from both direct assignments and lesson plan assignments
    const allAssignmentIds = classes.flatMap(cls => {
      const directAssignments = cls.assignments.map(assignment => assignment.id);
      const lessonPlanAssignments = cls.lessonPlans.flatMap(lp => 
        lp.assignments.map(assignment => assignment.id)
      );
      return [...directAssignments, ...lessonPlanAssignments];
    });

    // Remove duplicates
    const uniqueAssignmentIds = [...new Set(allAssignmentIds)];

    const submissions = await db.studentAssignmentSubmission.findMany({
      where: {
        studentId: { in: allStudentIds },
        assignmentId: { in: uniqueAssignmentIds },
        grade: { not: null }
      },
      select: {
        studentId: true,
        assignmentId: true,
        grade: true,
        assignment: {
          select: {
            classes: {
              select: {
                id: true,
                name: true,
                emoji: true,
                color: true
              }
            },
            lessonPlans: {
              select: {
                classes: {
                  select: {
                    id: true,
                    name: true,
                    emoji: true,
                    color: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate average grades per class
    const classPerformance = classes.map(cls => {
      const classSubmissions = submissions.filter(sub => 
        sub.assignment.classes.some(assignmentClass => assignmentClass.id === cls.id) ||
        sub.assignment.lessonPlans.some(lessonPlan => 
          lessonPlan.classes.some(lpClass => lpClass.id === cls.id)
        )
      );

      const totalGrades = classSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
      const averageGrade = classSubmissions.length > 0 
        ? Math.round(totalGrades / classSubmissions.length) 
        : 0;

      // Count students in different grade ranges
      const studentGrades = new Map<string, number[]>();
      
      classSubmissions.forEach(sub => {
        if (!studentGrades.has(sub.studentId)) {
          studentGrades.set(sub.studentId, []);
        }
        studentGrades.get(sub.studentId)!.push(sub.grade || 0);
      });

      // Calculate average grade per student in this class
      const studentAverages = Array.from(studentGrades.entries()).map(([studentId, grades]) => {
        const avg = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
        return Math.round(avg);
      });

      // Create grade distribution (0-100 in ranges of 10)
      const gradeRanges = {
        '90-100': 0,
        '80-89': 0,
        '70-79': 0,
        '60-69': 0,
        '50-59': 0,
        '0-49': 0
      };

      studentAverages.forEach(avg => {
        if (avg >= 90) gradeRanges['90-100']++;
        else if (avg >= 80) gradeRanges['80-89']++;
        else if (avg >= 70) gradeRanges['70-79']++;
        else if (avg >= 60) gradeRanges['60-69']++;
        else if (avg >= 50) gradeRanges['50-59']++;
        else gradeRanges['0-49']++;
      });

      return {
        id: cls.id,
        name: cls.name,
        emoji: cls.emoji,
        color: cls.color || 'primary',
        totalStudents: cls.enrollments.length,
        studentsWithGrades: studentAverages.length,
        averageGrade,
        gradeDistribution: gradeRanges,
        submissionCount: classSubmissions.length
      };
    });

    return {
      success: true,
      data: {
        classes: classPerformance,
        totalClasses: classes.length,
        totalStudents: allStudentIds.length
      }
    };
  } catch (error: any) {
    console.error("Get teacher classes performance error:", error);
    return { success: false, error: "Failed to fetch performance data" };
  }
}

// Get all assignments for a class (including from lesson plans) - for gradebook
export async function getClassAssignments(classCode: string): Promise<GradebookResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get teacher record
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return { success: false, error: "Teacher profile not found" };
    }

    // Verify the class exists and belongs to the teacher
    const classData = await db.class.findFirst({
      where: { 
        code: classCode,
        teacherId: teacher.id
      },
      select: { id: true }
    });

    if (!classData) {
      return { success: false, error: "Class not found or you don't have permission to access it" };
    }

    // Get all assignments for the class including those from lesson plans
    const assignments = await db.assignment.findMany({
      where: { 
        OR: [
          // Direct class assignments
          {
            classes: {
              some: {
                id: classData.id
              }
            }
          },
          // Assignments through lesson plans
          {
            lessonPlans: {
              some: {
                classes: {
                  some: {
                    id: classData.id
                  }
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        fileType: true,
        dueDate: true,
        activity: true,
        size: true,
        url: true,
        rubric: true,
        createdAt: true,
        updatedAt: true,
        lessonPlans: {
          select: {
            id: true,
            name: true
          }
        },
        studentSubmissions: {
          where: {
            grade: { not: null }
          },
          select: {
            grade: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Calculate average grades and add classId to each assignment for compatibility
    const assignmentsWithClassId = assignments.map(assignment => {
      const grades = assignment.studentSubmissions.map(sub => sub.grade).filter(grade => grade !== null) as number[];
      const averageGrade = grades.length > 0 
        ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
        : null;

      // Get the first lesson plan name if available
      const lessonPlanName = assignment.lessonPlans.length > 0 ? assignment.lessonPlans[0].name : null;

      return {
        ...assignment,
        classId: classData.id,
        averageGrade,
        totalSubmissions: assignment.studentSubmissions.length,
        lessonPlanName
      };
    });

    return {
      success: true,
      data: assignmentsWithClassId
    };
  } catch (error: any) {
    console.error("Get class assignments error:", error);
    return { success: false, error: "Failed to fetch assignments" };
  }
}