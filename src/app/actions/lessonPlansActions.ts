'use server';

import { db } from '@/src/lib/db';
import { getAuthSession } from '@/src/lib/auth';
import { revalidatePath } from 'next/cache';


interface GenericLessonPlanData {
  name: string;
  description?: string;
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
        class: {
          select: {
            grade: true, 
            name: true,
            emoji: true,
            code: true
          }
        },
        genericLessonPlan: true,
      },
    });

    // Map to include grade information
    const result = lessonPlans.map(plan => ({
      ...plan,
      grade: plan.class?.grade 
    }));

    return { success: true, data: result };
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
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Find the class first
    const classObj = await db.class.findUnique({
      where: { code: classCode },
      select: { id: true, userId: true, code: true, grade: true } 
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

    const lessonPlans = await db.lessonPlan.findMany({
      where: { classId: classCode },
      include: { 
        files: true, 
        assignmentRelations: true,
        class: { 
          select: {
            grade: true,
            name: true,
            emoji: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${lessonPlans.length} lesson plans for class code ${classCode}`);

    // Map the results to include grade information
    const result = lessonPlans.map(plan => ({
      ...plan,
      assignments: plan.assignmentRelations,
      grade: plan.class.grade 
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
    
    // First, try to find it as a regular lesson plan
    const lessonPlan = await db.lessonPlan.findUnique({
      where: { id: planId },
      include: {
        files: true,
        assignmentRelations: true,
        class: { 
          select: { 
            id: true, 
            userId: true, 
            code: true,
            name: true,
            emoji: true
          } 
        }
      },
    });
    
    if (lessonPlan) {
      // Authorization check for regular lesson plans
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
        assignments: lessonPlan.assignmentRelations,
        __typename: 'LessonPlan'
      };

      return { success: true, data: result };
    }
    
    // If not found as a regular lesson plan, try to find it as a template
    const genericLessonPlan = await db.genericLessonPlan.findUnique({
      where: { id: planId },
      include: {
        files: true,
        assignments: true // Include assignments for templates
      },
    });
    
    if (genericLessonPlan) {
      // For templates, allow access to all teachers and SUPER users
      if (session.user.role !== "TEACHER" && session.user.role !== "SUPER") {
        return { success: false, error: 'Forbidden: Only teachers can view templates' };
      }
      
      // Return the template with a type marker
      return { 
        success: true, 
        data: {
          ...genericLessonPlan,
          __typename: 'GenericLessonPlan',
          // Ensure assignments field exists for consistent interface
          assignments: genericLessonPlan.assignments || []
        }
      };
    }
    
    // If not found in either table
    return { success: false, error: 'Lesson plan not found' };
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


//GENERIC LESSON PLANS


// Add this function to allow super users to create generic lesson plans
export async function createGenericLessonPlan(
  data: GenericLessonPlanData,
): Promise<GenericLessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Check if user is a super user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPER") {
      return { success: false, error: "Not authorized to create generic lesson plans" };
    }

    if (!data.name) {
      return { success: false, error: 'Missing required fields' };
    }

    const newGenericLessonPlan = await db.genericLessonPlan.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: session.user.id,
      },
    });

    revalidatePath('/teacher/dashboard/lesson-plans');
    return { success: true, data: newGenericLessonPlan };
  } catch (error: any) {
    console.error('Create generic lesson plan error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to create generic lesson plan' };
  }
}

// Add this function to allow super users to delete generic lesson plans
export async function deleteGenericLessonPlan(
  id: string
): Promise<GenericLessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is a super user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPER") {
      return { success: false, error: "Not authorized to delete generic lesson plans" };
    }

    // Check if the generic lesson plan exists
    const genericLessonPlan = await db.genericLessonPlan.findUnique({
      where: { id },
      include: { lessonPlans: { select: { id: true } } }
    });

    if (!genericLessonPlan) {
      return { success: false, error: 'Generic lesson plan not found' };
    }

    // Delete the generic lesson plan
    await db.genericLessonPlan.delete({ where: { id } });
    
    revalidatePath('/teacher/dashboard/lesson-plans');
    return { success: true };
  } catch (error: any) {
    console.error('Delete generic lesson plan error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to delete generic lesson plan' };
  }
}

// Update the updateGenericLessonPlan function to get session automatically
export async function updateGenericLessonPlan(
  genericLessonPlanId: string,
  data: Partial<{ name: string; description: string }>,
): Promise<GenericLessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Check if user is a super user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPER") {
      return { success: false, error: "Not authorized to update generic lesson plans" };
    }

    // Check if the generic lesson plan exists
    const genericLessonPlan = await db.genericLessonPlan.findUnique({
      where: { id: genericLessonPlanId },
    });

    if (!genericLessonPlan) {
      return { success: false, error: 'Generic lesson plan not found' };
    }

    // Update the generic lesson plan
    const updated = await db.genericLessonPlan.update({
      where: { id: genericLessonPlanId },
      data,
    });
    
    revalidatePath('/teacher/dashboard/lesson-plans');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating generic lesson plan:", error);
    return { success: false, error: "Failed to update generic lesson plan" };
  }
}

// Get all generic lesson plans
export async function getGenericLessonPlans(): Promise<LessonPlanResponse> {
  try {
    const genericLessonPlans = await db.genericLessonPlan.findMany({
      orderBy: { createdAt: "desc" }, // Sort by creation date (newest first)
      include: {
        assignments: true, // Include related assignments
        files: true,       // Include related files
      },
    });

    return { success: true, data: genericLessonPlans };
  } catch (error: any) {
    console.error("Error fetching generic lesson plans:", error);
    return { success: false, error: "Failed to fetch generic lesson plans" };
  }
}




// Create a lesson plan using the generic lesson plan ID.
export async function copyGenericLessonPlanToUser(
  genericLessonPlanId: string,
  classId: string,
  customName?: string // Add optional custom name parameter
): Promise<LessonPlanResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Add validation for required classId
    if (!classId) {
      return { success: false, error: 'Class ID is required' };
    }
    
    // Verify the generic lesson plan exists
    const genericLessonPlan = await db.genericLessonPlan.findUnique({
      where: { id: genericLessonPlanId },
    });

    if (!genericLessonPlan) {
      return { success: false, error: "Generic lesson plan not found" };
    }
    
    // Verify the class exists and the user has access
    const classObj = await db.class.findFirst({
      where: { 
        code: classId,
        userId: session.user.id 
      },
    });

    if (!classObj) {
      return { success: false, error: "Class not found or you don't have permission" };
    }

    // Create the new lesson plan - use customName if provided, otherwise use template name
    const newLessonPlan = await db.lessonPlan.create({
      data: {
        name: customName || genericLessonPlan.name, // Use custom name if provided
        description: genericLessonPlan.description,
        classId,
        genericLessonPlanId: genericLessonPlan.id,
      },
    });

    // Revalidate paths to update UI
    revalidatePath(`/teacher/dashboard/classes/${classId}`);
    
    return { success: true, data: newLessonPlan };
  } catch (error: any) {
    console.error("Error copying generic lesson plan:", error);
    return { success: false, error: "Failed to copy generic lesson plan" };
  }
}