'use server';

import { db } from '@/src/lib/db';
import { getAuthSession } from '@/src/lib/auth';
import { revalidatePath } from 'next/cache';

interface FileData {
  name: string;
  fileType: string;
  activity?: string;
  size: number;
  url: string;
  classId: string;
  // Optionally associate with lesson plans (by their IDs)
  lessonPlanIds?: string[];
}

interface FileResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Create a file using the required fields from the dialog form.
export async function createFile(data: FileData): Promise<FileResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.name || !data.fileType || !data.url || !data.classId) {
      return { success: false, error: 'Missing required fields' };
    }

    // Verify the class belongs to the teacher
    const classObj = await db.class.findFirst({
      where: { 
        code: data.classId,
        userId: session.user.id
      }
    });
    
    if (!classObj) {
      return { success: false, error: 'Class not found or you do not have permission' };
    }

    const createdFile = await db.file.create({
      data: {
        name: data.name,
        fileType: data.fileType,
        activity: data.activity,
        size: data.size || 0,
        url: data.url,
        classId: data.classId,
        lessonPlans: data.lessonPlanIds && data.lessonPlanIds.length > 0
          ? {
              connect: data.lessonPlanIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });

    revalidatePath(`/dashboard/classes/${classObj.code}`);
    return { success: true, data: createdFile };
  } catch (error: any) {
    console.error('Create file error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to create file: ' + (error?.message || '') };
  }
}

// Get a single file by ID including its related lesson plans.
export async function getFileByID(id: string): Promise<FileResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = await db.file.findUnique({
      where: { id },
      include: { 
        lessonPlans: true, // LessonPlanFiles relation
        class: { select: { userId: true } }
      },
    });

    if (!file) return { success: false, error: 'File not found' };

    // Authorization: Teachers should own the class, students should be enrolled
    if (session.user.role === "TEACHER" && file.class.userId !== session.user.id) {
      return { success: false, error: 'Forbidden: You do not own this class' };
    } else if (session.user.role === "STUDENT") {
      const enrollment = await db.enrollment.findFirst({
        where: {
          student: { userId: session.user.id },
          classId: file.classId,
          enrolled: true
        }
      });
      if (!enrollment) {
        return { success: false, error: 'Forbidden: Not enrolled in this class' };
      }
    }

    return { success: true, data: file };
  } catch (error: any) {
    console.error('Get file error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to get file' };
  }
}

// Get all files for a lessonPlan (Teacher and enrolled Students)
export async function getFiles(lessonPlanId?: string): Promise<FileResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Basic implementation: Get files for a specific lesson plan
    if (!lessonPlanId) {
      return { success: false, error: 'Lesson Plan ID is required for this query' };
    }

    // Verify access to the lesson plan first
    const lessonPlan = await db.lessonPlan.findUnique({
      where: { id: lessonPlanId },
      include: { class: { select: { id: true, userId: true } } },
    });

    if (!lessonPlan) return { success: false, error: 'Lesson Plan not found' };

    // Authorization check
    if (session.user.role === 'TEACHER' && lessonPlan.class.userId !== session.user.id) {
      return { success: false, error: 'Forbidden: You do not own this class' };
    } else if (session.user.role === 'STUDENT') {
      const enrollment = await db.enrollment.findFirst({
        where: {
          student: { userId: session.user.id },
          classId: lessonPlan.classId,
          enrolled: true,
        },
      });
      if (!enrollment) {
        return { success: false, error: 'Forbidden: Not enrolled in this class' };
      }
    }

    const files = await db.file.findMany({
      where: { lessonPlans: { some: { id: lessonPlanId } } },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, data: files };
  } catch (error: any) {
    console.error('Get files error:', error);
    return { success: false, error: 'Failed to fetch files' };
  }
}

// Update a file by ID using the required fields.
export async function updateFile(id: string, data: FileData): Promise<FileResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.name || !data.fileType || !data.url || !data.size || !data.classId) {
      return { success: false, error: 'Missing required fields' };
    }
    
    // Verify file exists and belongs to teacher
    const existingFile = await db.file.findUnique({
      where: { id },
      include: { class: { select: { userId: true, code: true } } } // Ensure 'class' relation is included
    });

    if (!existingFile) {
      return { success: false, error: 'File not found' };
    }
    
    if (!existingFile || existingFile.class.userId !== session.user.id) {
      return { success: false, error: 'File not found or you do not have permission' };
    }

    const updatedFile = await db.file.update({
      where: { id },
      data: {
        name: data.name,
        fileType: data.fileType,
        activity: data.activity,
        size: data.size,
        url: data.url,
        classId: data.classId,
        lessonPlans: data.lessonPlanIds
          ? {
              set: data.lessonPlanIds.map((lpId) => ({ id: lpId })),
            }
          : undefined,
      },
      include: { lessonPlans: true },
    });

    revalidatePath(`/dashboard/classes/${existingFile.class.code}`);
    return { success: true, data: updatedFile };
  } catch (error: any) {
    console.error('Update file error:', error);
    return { success: false, error: 'Failed to update file' };
  }
}

// To assign to other class via lesson plans
interface CopyFileParams {
  sourceFileId: string;
  targetLessonPlanId: string;
  targetClassId: string;
}

export async function copyFileToLessonPlan({
  sourceFileId,
  targetLessonPlanId,
  targetClassId,
}: CopyFileParams): Promise<FileResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify source file exists and belongs to teacher
    const sourceFile = await db.file.findUnique({
      where: { id: sourceFileId },
      include: { class: { select: { userId: true, code: true } } } // Include code for display
    });

    if (!sourceFile || sourceFile.class.userId !== session.user.id) {
      return { success: false, error: 'Source file not found or you do not have permission' };
    }

    // Verify target class and lesson plan belong to teacher
    // Important: Use code for lookup since classId in schema is code
    const targetClass = await db.class.findFirst({
      where: { 
        code: targetClassId, // Using code here since that's what you pass in UI
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
      return { success: false, error: 'Target lesson plan not found in specified class' };
    }

    // Create a new file record with the same details but new connections
    const newFile = await db.file.create({
      data: {
        name: sourceFile.name,
        fileType: sourceFile.fileType,
        activity: sourceFile.activity,
        size: sourceFile.size || 0,
        url: sourceFile.url,
        classId: targetClassId, // Use class code
        lessonPlans: {
          connect: { id: targetLessonPlanId },
        },
      },
      include: { lessonPlans: true },
    });

    revalidatePath(`/dashboard/classes/${targetClass.code}`);
    return { success: true, data: newFile };
  } catch (error: any) {
    console.error('Copy file error:', error);
    return { success: false, error: 'Failed to copy file to lesson plan: ' + (error?.message || '') };
  }
}

// Delete a file by ID.
export async function deleteFile(id: string): Promise<FileResponse> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify file exists and belongs to teacher
    const existingFile = await db.file.findUnique({
      where: { id },
      include: { class: { select: { userId: true, code: true } } }
    });
    
    if (!existingFile || existingFile.class.userId !== session.user.id) {
      return { success: false, error: 'File not found or you do not have permission' };
    }

    await db.file.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/classes/${existingFile.class.code}`);
    return { success: true };
  } catch (error: any) {
    console.error('Delete file error:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to delete file' };
  }
}