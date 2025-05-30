'use server';

import { db } from '@/src/lib/db';
import { getAuthSession } from '@/src/lib/auth';
import { revalidatePath } from 'next/cache';

interface LessonPlanData {
  name: string;
  description?: string;
  classCode: string;
}

interface LessonPlanResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Create a lesson plan using classCode instead of a raw classId.
export async function createLessonPlan(
  data: LessonPlanData
): Promise<LessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }
    if (!data.name || !data.classCode) {
      return { success: false, error: 'Missing required fields' };
    }
    // Lookup the class using its public code.
    const classObj = await db.class.findUnique({
      where: { code: data.classCode },
    });
    if (!classObj) {
      return { success: false, error: 'Class not found' };
    }
    // Ensure the teacher owns the class
    if (classObj.userId !== session.user.id) {
      return { success: false, error: 'Forbidden: You do not own this class' };
    }

    const newLessonPlan = await db.lessonPlan.create({
      data: {
        name: data.name,
        description: data.description,
        classId: classObj.code,
      },
    });
    revalidatePath(`/teacher/dashboard/classes/${data.classCode}`);
    return { success: true, data: newLessonPlan };
  } catch (error: any) {
    console.error(
      'Create lesson plan error:',
      error?.message || 'Unknown error'
    );
    return { success: false, error: 'Failed to create lesson plan' };
  }
}

// Get all lesson plans for a given classCode.
export async function getLessonPlansByClass(
  classCode: string
): Promise<LessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Find the class first
    const classObj = await db.class.findUnique({
      where: { code: classCode },
      select: { id: true, userId: true, code: true }
    });

    if (!classObj) {
      return { success: false, error: 'Class not found' };
    }

    // If student, check enrollment
    if (session.user.role === "STUDENT") {
      const enrollment = await db.enrollment.findFirst({
        where: {
          student: { userId: session.user.id },
          classId: classObj.id,
          enrolled: true
        }
      });
      if (!enrollment) {
        return { success: false, error: 'Forbidden: Not enrolled in this class' };
      }
    }
    // If teacher, check ownership
    else if (session.user.role === "TEACHER" && classObj.userId !== session.user.id) {
      return { success: false, error: 'Forbidden: You do not own this class' };
    }

    // This is the key fix - we need to use the class CODE as the foreign key
    // because that's how your schema is set up
    const lessonPlans = await db.lessonPlan.findMany({
      where: { classId: classCode }, // Use the original classCode parameter
      include: { 
        files: true, 
        assignmentRelations: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${lessonPlans.length} lesson plans for class code ${classCode}`);

    // Map the results to maintain backward compatibility
    const result = lessonPlans.map(plan => ({
      ...plan,
      assignments: plan.assignmentRelations
    }));

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Get lesson plans error:', error);
    return { success: false, error: 'Failed to fetch lesson plans' };
  }
}

// Get a single lesson plan by its ID.
export async function getLessonPlanByID(planId: string): Promise<LessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Use the correct relation name "assignmentRelations" instead of "assignments"
    const lessonPlan = await db.lessonPlan.findUnique({
      where: { id: planId },
      include: {
        files: true,
        assignmentRelations: true, // Changed from "assignments" to "assignmentRelations" 
        class: { select: { id: true, userId: true, code: true } }
      },
    });
    
    if (!lessonPlan) {
      return { success: false, error: 'Lesson plan not found' };
    }

    // Authorization check: Teacher owns class or Student is enrolled
    if (session.user.role === "TEACHER" && lessonPlan.class.userId !== session.user.id) {
      return { success: false, error: 'Forbidden: You do not own this class' };
    } else if (session.user.role === "STUDENT") {
      const enrollment = await db.enrollment.findFirst({
        where: {
          student: { userId: session.user.id },
          classId: lessonPlan.classId,
          enrolled: true
        }
      });
      if (!enrollment) {
        return { success: false, error: 'Forbidden: Not enrolled in this class' };
      }
    }

    // Rename fields in response to maintain backward compatibility
    const result = {
      ...lessonPlan,
      assignments: lessonPlan.assignmentRelations
    };

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Get lesson plan error:', error);
    return { success: false, error: 'Failed to fetch lesson plan' };
  }
}

// Update a lesson plan by its ID.
export async function updateLessonPlan(planId: string, data: { name?: string; description?: string }): Promise<LessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify teacher owns the class associated with the lesson plan
    const lessonPlan = await db.lessonPlan.findUnique({
      where: { id: planId },
      select: { class: { select: { userId: true, code: true } } }
    });

    if (!lessonPlan || lessonPlan.class.userId !== session.user.id) {
      return { success: false, error: 'Forbidden or Lesson Plan not found' };
    }

    const updated = await db.lessonPlan.update({
      where: { id: planId },
      data,
    });
    revalidatePath(`/teacher/dashboard/classes/${lessonPlan.class.code}`); // Revalidate using class code
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Update lesson plan error:', error);
    return { success: false, error: 'Failed to update lesson plan' };
  }
}

// Delete a lesson plan by its ID.
export async function deleteLessonPlan(
  id: string
): Promise<LessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify teacher owns the class associated with the lesson plan
    const lessonPlan = await db.lessonPlan.findUnique({
      where: { id: id },
      select: { class: { select: { userId: true, code: true } } }
    });

    if (!lessonPlan || lessonPlan.class.userId !== session.user.id) {
      return { success: false, error: 'Forbidden or Lesson Plan not found' };
    }

    await db.lessonPlan.delete({ where: { id } });
    revalidatePath(`/teacher/dashboard/classes/${lessonPlan.class.code}`); // Revalidate using class code
    return { success: true };
  } catch (error: any) {
    console.error(
      'Delete lesson plan error:',
      error?.message || 'Unknown error'
    );
    return { success: false, error: 'Failed to delete lesson plan' };
  }
}
