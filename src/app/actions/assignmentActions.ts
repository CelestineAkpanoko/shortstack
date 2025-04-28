'use server';

import { db } from '@/src/lib/db';
import { getAuthSession } from '@/src/lib/auth';
import { revalidatePath } from 'next/cache';

interface AssignmentData {
  name: string;
  activity?: string;
  dueDate?: Date;
  classId: string;
  lessonPlanIds?: string[];
  url?: string;       // Added for file URL
  fileType?: string;  // Added for file type
  size?: number;      // Added for file size
}

interface AssignmentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Create an assignment using the required fields.
export async function createAssignment(data: AssignmentData): Promise<AssignmentResponse> {
  try {
    console.log("Starting assignment creation...");
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.name || !data.classId) {
      return { success: false, error: 'Missing required fields' };
    }
    
    // Verify the class exists and belongs to this teacher
    const classObj = await db.class.findFirst({
      where: { 
        code: data.classId, // Use code for lookup
        userId: session.user.id
      },
      select: { id: true, code: true }
    });
    
    if (!classObj) {
      return { success: false, error: 'Class not found or you do not have permission' };
    }
    
    console.log('Class found with code:', classObj.code, 'and ID:', classObj.id);
    
    // Create assignment using class CODE as the classId (not the internal ID)
    // This is critical because your schema expects classId to reference the code field
    const createdAssignment = await db.assignment.create({
      data: {
        name: data.name,
        activity: data.activity,
        dueDate: data.dueDate,
        classId: classObj.code, // Use the class CODE, not the id
        url: data.url || '', 
        fileType: data.fileType || '',
        size: data.size || 0,
        lessonPlans: data.lessonPlanIds && data.lessonPlanIds.length > 0
          ? {
              connect: data.lessonPlanIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });

    console.log('Assignment created successfully:', createdAssignment.id);
    
    revalidatePath(`/teacher/dashboard/classes/${classObj.code}`);
    revalidatePath(`/teacher/dashboard/classes/${classObj.code}/lesson-plans`);
    
    return { success: true, data: createdAssignment };
  } catch (error: any) {
    console.error('Create assignment error:', error);
    return { success: false, error: 'Failed to create assignment: ' + (error?.message || '') };
  }
}

// Get a single assignment by ID including its related lesson plans.
export async function getAssignmentByID(id: string): Promise<AssignmentResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Use the correct relation
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: { 
        lessonPlans: true, // LessonPlanAssignments relation
        class: { select: { userId: true } } 
      },
    });

    if (!assignment) {
      return { success: false, error: 'Assignment not found' };
    }
    
    // Authorization check
    if (session.user.role === "TEACHER" && assignment.class.userId !== session.user.id) {
      return { success: false, error: 'Forbidden: You do not own this class' };
    } else if (session.user.role === "STUDENT") {
      const enrollment = await db.enrollment.findFirst({
        where: {
          student: { userId: session.user.id },
          classId: assignment.classId,
          enrolled: true
        }
      });
      if (!enrollment) {
        return { success: false, error: 'Forbidden: Not enrolled in this class' };
      }
    }

    return { success: true, data: assignment };
  } catch (error: any) {
    console.error('Get assignment error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to get assignment' };
  }
}

// Get all assignments and include their associated lesson plans.
export async function getAssignments(classId?: string): Promise<AssignmentResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    
    let whereClause = {};
    
    if (classId) {
      // If classId provided, filter by it
      if (session.user.role === "TEACHER") {
        // Teachers can only see assignments for classes they own
        whereClause = {
          classId,
          class: {
            userId: session.user.id
          }
        };
      } else if (session.user.role === "STUDENT") {
        // Students can only see assignments for classes they're enrolled in
        const enrollment = await db.enrollment.findFirst({
          where: {
            student: { userId: session.user.id },
            classId,
            enrolled: true
          }
        });
        
        if (!enrollment) {
          return { success: false, error: 'Forbidden: Not enrolled in this class' };
        }
        
        whereClause = { classId };
      }
    } else {
      // No classId provided
      if (session.user.role === "TEACHER") {
        // Teachers see assignments for all their classes
        whereClause = {
          class: {
            userId: session.user.id
          }
        };
      } else if (session.user.role === "STUDENT") {
        // Students see assignments for all classes they're enrolled in
        const enrollments = await db.enrollment.findMany({
          where: {
            student: { userId: session.user.id },
            enrolled: true
          },
          select: { classId: true }
        });
        
        const classIds = enrollments.map(e => e.classId);
        
        whereClause = {
          classId: { in: classIds }
        };
      }
    }

    const assignments = await db.assignment.findMany({
      where: whereClause,
      include: { 
        lessonPlans: true,
        class: { select: { name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: assignments };
  } catch (error: any) {
    console.error('Get assignments error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to get assignments' };
  }
}

// Update an assignment by ID using the required fields.
export async function updateAssignment(id: string, data: AssignmentData): Promise<AssignmentResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify assignment exists and belongs to teacher
    const existingAssignment = await db.assignment.findUnique({
      where: { id },
      include: { class: { select: { userId: true, code: true } } }
    });
    
    if (!existingAssignment || existingAssignment.class.userId !== session.user.id) {
      return { success: false, error: 'Assignment not found or you do not have permission' };
    }

    if (!data.name || !data.classId) {
      return { success: false, error: 'Missing required fields' };
    }

    const updatedAssignment = await db.assignment.update({
      where: { id },
      data: {
        name: data.name,
        activity: data.activity,
        dueDate: data.dueDate,
        classId: data.classId,
        lessonPlans: data.lessonPlanIds
          ? {
              set: data.lessonPlanIds.map((lpId) => ({ id: lpId })),
            }
          : undefined,
      },
      include: { lessonPlans: true },
    });

    revalidatePath(`/dashboard/classes/${existingAssignment.class.code}`);
    return { success: true, data: updatedAssignment };
  } catch (error: any) {
    console.error('Update assignment error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to update assignment' };
  }
}

// Copy an assignment to another class via lesson plans.
interface CopyAssignmentParams {
  sourceAssignmentId: string;
  targetLessonPlanId: string;
  targetClassId: string;
}

export async function copyAssignmentToLessonPlan({
  sourceAssignmentId,
  targetLessonPlanId,
  targetClassId,
}: CopyAssignmentParams): Promise<AssignmentResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify source assignment exists and belongs to teacher
    const sourceAssignment = await db.assignment.findUnique({
      where: { id: sourceAssignmentId },
      include: { class: { select: { userId: true, code: true } } }
    });

    if (!sourceAssignment || sourceAssignment.class.userId !== session.user.id) {
      return { success: false, error: 'Source assignment not found or you do not have permission' };
    }
    
    // Verify target class belongs to teacher - use code for lookup
    const targetClass = await db.class.findFirst({
      where: { 
        code: targetClassId, // Use code instead of ID
        userId: session.user.id
      },
      select: { id: true, code: true }
    });
    
    if (!targetClass) {
      return { success: false, error: 'Target class not found or you do not have permission' };
    }
    
    // Verify target lesson plan exists in target class
    const targetLessonPlan = await db.lessonPlan.findFirst({
      where: {
        id: targetLessonPlanId,
        class: { code: targetClassId } // Join through class relation
      }
    });
    
    if (!targetLessonPlan) {
      return { success: false, error: 'Target lesson plan not found in the specified class' };
    }

    const newAssignment = await db.assignment.create({
      data: {
        name: sourceAssignment.name,
        activity: sourceAssignment.activity,
        dueDate: sourceAssignment.dueDate,
        classId: targetClassId, // Use class code
        lessonPlans: {
          connect: { id: targetLessonPlanId },
        },
        fileType: sourceAssignment.fileType || 'unknown',
        size: sourceAssignment.size || 0,
        url: sourceAssignment.url || '',
      },
      include: { lessonPlans: true },
    });

    revalidatePath(`/dashboard/classes/${targetClass.code}`);
    return { success: true, data: newAssignment };
  } catch (error: any) {
    console.error('Copy assignment error:', error);
    return { success: false, error: 'Failed to copy assignment to lesson plan: ' + (error?.message || '') };
  }
}

// Delete an assignment by ID.
export async function deleteAssignment(id: string): Promise<AssignmentResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify assignment exists and belongs to teacher
    const existingAssignment = await db.assignment.findUnique({
      where: { id },
      include: { class: { select: { userId: true, code: true } } }
    });
    
    if (!existingAssignment || existingAssignment.class.userId !== session.user.id) {
      return { success: false, error: 'Assignment not found or you do not have permission' };
    }

    await db.assignment.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/classes/${existingAssignment.class.code}`);
    return { success: true };
  } catch (error: any) {
    console.error('Delete assignment error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to delete assignment' };
  }
}

// Submit an assignment.
export async function submitAssignment(formData: FormData): Promise<AssignmentResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return { success: false, error: 'Unauthorized' };
    }
    
    const studentId = session.user.id;
    const assignmentId = formData.get('assignmentId') as string;
    
    if (!assignmentId) {
      return { success: false, error: 'Missing assignment ID' };
    }
    
    // Check if the assignment exists and student has access
    const assignment = await db.assignment.findFirst({
      where: {
        id: assignmentId,
        class: {
          enrollments: {
            some: {
              studentId,
              enrolled: true
            }
          }
        }
      }
    });
    
    if (!assignment) {
      return { success: false, error: 'Assignment not found or access denied' };
    }

    // Get submission details
    const fileUrl = formData.get('fileUrl') as string || null;
    const textContent = formData.get('textContent') as string || null;
    const comments = formData.get('comments') as string || null;
    const fileName = formData.get('fileName') as string || null;
    const fileType = formData.get('fileType') as string || null;
    
    // Since we don't have a separate submission model, we'll update the assignment
    // with submission data for this student. In a real app, you'd create a separate
    // model for student submissions.
    
    // For now, let's just log the submission details
    console.log('Assignment submission received:');
    console.log('- Assignment ID:', assignmentId);
    console.log('- Student ID:', studentId);
    console.log('- File URL:', fileUrl);
    console.log('- Text Content:', textContent?.substring(0, 50) + (textContent && textContent.length > 50 ? '...' : ''));
    console.log('- Comments:', comments);
    
    // We'll just return success for now, as if the submission was saved
    return {
      success: true,
      data: {
        id: 'submission-placeholder',
        assignmentId,
        studentId,
        submittedAt: new Date()
      }
    };
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    return { success: false, error: error.message || 'Failed to submit assignment' };
  }
}

// Get a student assignment.
export async function getStudentAssignment(assignmentId: string): Promise<AssignmentResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return { success: false, error: 'Unauthorized' };
    }
    
    const studentId = session.user.id;
    console.log(`Student ${studentId} requesting assignment ${assignmentId}`);
    
    // Find the assignment
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lessonPlans: true,
        class: {
          include: {
            enrollments: {
              where: {
                studentId: studentId,
                enrolled: true
              }
            }
          }
        }
      }
    });
    
    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }
    
    // Check if student is enrolled in the class
    if (!assignment.class.enrollments || assignment.class.enrollments.length === 0) {
      return { success: false, error: "You don't have access to this assignment" };
    }

    // Since we don't have a StudentSubmission model yet, we'll 
    // just return the assignment data without submission info for now
    return { 
      success: true, 
      data: {
        id: assignment.id,
        name: assignment.name,
        description: assignment.rubric,
        dueDate: assignment.dueDate,
        activity: assignment.activity || "Assignment",
        grade: 0, // Default grade since we don't have submissions yet
        url: assignment.url,
        fileType: assignment.fileType
      } 
    };
  } catch (error: any) {
    console.error('Error fetching student assignment:', error);
    return { success: false, error: error.message || 'Failed to load assignment data' };
  }
}