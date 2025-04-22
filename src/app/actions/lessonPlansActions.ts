'use server';

import { db } from '@/src/lib/db';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';


interface GenericLessonPlanData {
  name: string;
  description?: string;
  classCode: string;
}

interface GenericLessonPlanResponse {
  success: boolean;
  data?: any;
  error?: string;
}


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
    const { userId } = await auth();
    if (!userId) {
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
    const newLessonPlan = await db.lessonPlan.create({
      data: {
        name: data.name,
        description: data.description,
        // Use the class object's internal id for the relation.
        classId: classObj.code,
      },
    });
    revalidatePath(`/dashboard/classes/${data.classCode}`);
    return { success: true, data: newLessonPlan };
  } catch (error: any) {
    console.error(
      'Create lesson plan error:',
      error?.message || 'Unknown error'
    );
    return { success: false, error: 'Failed to create lesson plan' };
  }
}

// Create a lesson plan using the generic lesson plan ID.
export async function copyGenericLessonPlanToUser(
  genericLessonPlanId: string,
  userId: string,
  classId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const genericLessonPlan = await db.genericLessonPlan.findUnique({
      where: { id: genericLessonPlanId },
    });

    if (!genericLessonPlan) {
      return { success: false, error: "Generic lesson plan not found" };
    }

    const newLessonPlan = await db.lessonPlan.create({
      data: {
        name: genericLessonPlan.name,
        description: genericLessonPlan.description,
        classId,
        genericLessonPlanId: genericLessonPlan.id,
      },
    });

    return { success: true, data: newLessonPlan };
  } catch (error) {
    console.error("Error copying generic lesson plan:", error);
    return { success: false, error: "Failed to copy generic lesson plan" };
  }
}

// Update a generic lesson plan.
// This function is only accessible to super users.
export async function updateGenericLessonPlan(
  genericLessonPlanId: string,
  data: Partial<{ name: string; description: string }>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPER_USER") {
    return { success: false, error: "Not authorized to update generic lesson plans" };
  }

  try {
    await db.genericLessonPlan.update({
      where: { id: genericLessonPlanId },
      data,
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating generic lesson plan:", error);
    return { success: false, error: "Failed to update generic lesson plan" };
  }
}

// Get all lesson plans for a given user.
export async function getLessonPlans(userId: string): Promise<any> {
  try {
    const lessonPlans = await db.lessonPlan.findMany({
      where: {
        OR: [
          { class: { userId } }, // User-specific lesson plans
          { genericLessonPlanId: null }, // Generic lesson plans
        ],
      },
      include: {
        class: true,
        genericLessonPlan: true,
      },
    });

    return { success: true, data: lessonPlans };
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    return { success: false, error: "Failed to fetch lesson plans" };
  }
}

// Get all lesson plans for a given classCode.
export async function getLessonPlansByClass(
  classCode: string
): Promise<LessonPlanResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }
    // Query lesson plans via the related class code.
    const lessonPlans = await db.lessonPlan.findMany({
      where: { class: { code: classCode } },
      include: { files: true, assignments: true },
    });
    return { success: true, data: lessonPlans };
  } catch (error: any) {
    console.error(
      'Get lesson plans error:',
      error?.message || 'Unknown error'
    );
    return { success: false, error: 'Failed to fetch lesson plans' };
  }
}

// Get a single lesson plan by its ID.
export async function getLessonPlanByID(planId: string) {
  try {
    const lessonPlan = await db.lessonPlan.findUnique({
      where: { id: planId }, // Must use "id" if planId is truly the DB id
      include: {
        files: true,
        assignments: true,
      },
    });
    if (!lessonPlan) {
      return { success: false, error: 'Lesson plan not found' };
    }
    return { success: true, data: lessonPlan };
  } catch (error: any) {
    console.error('Get lesson plan error:', error);
    return { success: false, error: 'Failed to fetch lesson plan' };
  }
}
// Update a lesson plan by its ID.
export async function updateLessonPlan(planId: string, data: { name: string; description?: string }) {
  try {
    const updated = await db.lessonPlan.update({
      where: { id: planId },
      data,
    });
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
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }
    await db.lessonPlan.delete({ where: { id } });
    revalidatePath('/dashboard/classes');
    return { success: true };
  } catch (error: any) {
    console.error(
      'Delete lesson plan error:',
      error?.message || 'Unknown error'
    );
    return { success: false, error: 'Failed to delete lesson plan' };
  }
}
