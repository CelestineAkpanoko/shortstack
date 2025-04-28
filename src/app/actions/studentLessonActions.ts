'use server';

import { db } from '@/src/lib/db';
import { getAuthSession } from '@/src/lib/auth';

interface LessonResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Get all lesson plans for a student in a specific class
export async function getStudentLessonsByClass(classCode: string): Promise<LessonResponse> {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
       return { success: false, error: 'Unauthorized: Students only' };
    }

    // Find the student profile ID
    const student = await db.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
    });
    if (!student) {
        return { success: false, error: 'Student profile not found' };
    }
    const studentId = student.id;

    // First, verify the student is enrolled in this class by code
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId,
        class: { code: classCode },
        enrolled: true
      },
      select: { classId: true } // Get class ID for the next query
    });

    if (!enrollment) {
       return { success: false, error: 'Not enrolled in this class or class not found' };
    }

    // Query lesson plans for this class
    const lessonPlans = await db.lessonPlan.findMany({
        where: { classId: enrollment.classId },
        include: {
            files: true, // Include files associated with the lesson plan
            assignmentRelations: true // Instead of assignments
        },
        orderBy: { createdAt: 'asc' }
    });

    return { success: true, data: lessonPlans };

  } catch (error: any) {
     console.error('Get student lessons error:', error);
     return { success: false, error: 'Failed to fetch lesson plans' };
  }
}

// Get a specific lesson plan for a student
export async function getStudentLessonById(lessonId: string): Promise<LessonResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return { success: false, error: 'Unauthorized' };
    }
    
    console.log(`Student ${session.user.id} requesting lesson ${lessonId}`);
    
    // First, find the lesson plan and check if the class exists
    const lessonPlan = await db.lessonPlan.findUnique({
      where: { id: lessonId },
      include: {
        class: { 
          select: { 
            id: true, 
            code: true, 
            name: true, 
            emoji: true
          } 
        },
      },
    });
    
    if (!lessonPlan) {
      console.log(`Lesson plan ${lessonId} not found`);
      return { success: false, error: 'Lesson plan not found' };
    }
    
    console.log(`Found lesson plan: ${lessonPlan.name} for class ${lessonPlan.class.name}`);
    
    // Check if the student is enrolled in this class
    const studentId = session.user.id;
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId: studentId,
        classId: lessonPlan.class.id,
        enrolled: true
      }
    });
    
    if (!enrollment) {
      console.log(`Student ${studentId} is not enrolled in class ${lessonPlan.class.id}`);
      return { success: false, error: 'You are not enrolled in this class' };
    }
    
    // Fetch the full lesson data with files and assignments
    const fullLessonData = await db.lessonPlan.findUnique({
      where: { id: lessonId },
      include: {
        class: { 
          select: { 
            id: true, 
            code: true, 
            name: true, 
            emoji: true
          } 
        },
        files: true,
        // Important: use assignmentRelations and map it to assignments in the response
        assignmentRelations: true
      }
    });
    
    // Transform the data to match the expected format
    const transformedData = fullLessonData ? {
      ...fullLessonData,
      assignments: fullLessonData.assignmentRelations
    } : null;
    
    if (!transformedData) {
      return { success: false, error: 'Lesson data not found' };
    }
    
    console.log(`Successfully retrieved lesson data for student ${studentId}`);
    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error fetching student lesson:', error);
    return { success: false, error: 'Failed to fetch lesson data' };
  }
}