'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/src/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Copy } from 'lucide-react';
import { deleteLessonPlan, deleteGenericLessonPlan } from '@/src/app/actions/lessonPlansActions';
import { toast } from 'sonner';
import EditLessonPlanDialog from './EditLessonPlanDialog';
import { Badge } from '@/src/components/ui/badge';

interface LessonPlanCardProps {
  plan: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    classId?: string;
    grade?: string; 
    class?: {       
      name?: string;
      emoji?: string;
      grade?: string;
    };
  };
  backgroundColor: string;
  isTemplate?: boolean;
  isSuperUser?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
  viewContext?: 'class' | 'dashboard';
}

export default function LessonPlanCard({ 
  plan, 
  backgroundColor,
  isTemplate = false,
  isSuperUser = false,
  onEdit,
  onDelete,
  onUpdate,
  viewContext = 'dashboard',
}: LessonPlanCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Determine the link URL based on whether this is a template or regular plan
  const getLinkUrl = () => {
    if (viewContext === 'class' && plan.classId) {
      // When viewed from class context, use class-specific route
      return `/teacher/dashboard/classes/${plan.classId}/lesson-plans/${plan.id}`;
    } else {
      // Whether it's a template or regular plan, use the same detail view route
      // The LessonPlanDetailView will display it correctly based on the template status
      return `/teacher/dashboard/lesson-plans/${plan.id}`;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on dropdown
    if ((e.target as HTMLElement).closest('.dropdown-menu')) {
      e.preventDefault();
      return;
    }
    
    // Otherwise navigation will happen naturally through the Link
  };

  const handleDelete = async () => {
    // If parent component provided onDelete, use that instead
    if (onDelete) {
      onDelete();
      return;
    }
    
    // Otherwise use built-in delete functionality
    toast.promise(
      async () => {
        setIsDeleting(true);
        try {
          // Delete the appropriate type of lesson plan
          const response = isTemplate
            ? await deleteGenericLessonPlan(plan.id)
            : await deleteLessonPlan(plan.id);
            
          if (!response.success) {
            throw new Error(response.error || 'Failed to delete lesson plan');
          }
          
          // Trigger refresh in parent component
          if (onUpdate) onUpdate();
          
          // Also manually refresh the router
          router.refresh();
          
          return response;
        } finally {
          setIsDeleting(false);
        }
      },
      {
        loading: `Deleting ${isTemplate ? 'template' : 'lesson plan'}...`,
        success: `${isTemplate ? 'Template' : 'Lesson plan'} deleted successfully`,
        error: (err) => `${err.message || 'Failed to delete'}`
      }
    );
  };

  const handleEdit = () => {
    // If parent component provided onEdit, use that instead
    if (onEdit) {
      onEdit();
      return;
    }
    
    // Otherwise use built-in edit functionality
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Trigger update in parent component
    if (onUpdate) onUpdate();
    // Also manually refresh the router
    router.refresh();
  };

  return (
    <>
      <Link href={getLinkUrl()} onClick={handleCardClick}>
        <Card 
          className={`${backgroundColor} w-[250px] h-[250px] rounded-xl relative cursor-pointer hover:shadow-lg transition-shadow`}
        >
          {/* Template badge if applicable */}
          {isTemplate && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 bg-white/30 backdrop-blur-sm text-black"
            >
              Template
            </Badge>
          )}
          
          {/* Grade badge */}
          {plan.grade && !isTemplate && (
            <Badge 
              variant="outline" 
              className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-black border-black/20"
            >
              Grade {plan.grade}
            </Badge>
          )}
          
          {/* Adjust template badge position if both are present */}
          {isTemplate && plan.grade && (
            <Badge 
              variant="outline" 
              className="absolute top-11 left-2 bg-white/20 backdrop-blur-sm text-black border-black/20"
            >
              Grade {plan.grade}
            </Badge>
          )}
          
          {/* Only show dropdown if not a template or if super user */}
          {(!isTemplate || isSuperUser) && (
            <div className="absolute top-2 right-2 z-10 dropdown-menu" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="bg-white/20  rounded-full p-1 hover:bg-white/40 transition-colors">
                  <MoreHorizontal className="h-5 w-5 text-black" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit} disabled={isDeleting}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Lesson Plan
                  </DropdownMenuItem>
                  
                  {/* Special template actions for non-super users */}
                  {isTemplate && !isSuperUser && (
                    <DropdownMenuItem onClick={() => router.push(`/teacher/dashboard/lesson-plans/use-template/${plan.id}`)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Use Template
                    </DropdownMenuItem>
                  )}
                  
                  {/* Only super users can delete templates */}
                  {(!isTemplate || isSuperUser) && (
                    <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <CardContent className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold text-black text-center">{plan.name}</h1>
            
            {/* Show class context when viewed from dashboard */}
            {viewContext === 'dashboard' && plan.class && (
              <div className="mt-2 text-center">
                <p className="text-black/60 text-xs">
                  {plan.class.emoji} {plan.class.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Edit Dialog - only shown for non-template plans or if super user */}
      {(!isTemplate || isSuperUser) && (
        <EditLessonPlanDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
          lessonPlan={plan}
        />
      )}
    </>
  );
}