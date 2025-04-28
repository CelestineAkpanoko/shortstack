import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/src/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { deleteLessonPlan } from '@/src/app/actions/lessonPlansActions';
import { toast } from 'sonner';
import EditLessonPlanDialog from './EditLessonPlanDialog';

interface LessonPlanCardProps {
  plan: any;
  classCode: string;
  onUpdate?: () => void; // Add this prop to handle updates
}

export default function LessonPlanCard({ plan, classCode, onUpdate }: LessonPlanCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on dropdown
    if ((e.target as HTMLElement).closest('.dropdown-menu')) {
      e.preventDefault();
      return;
    }
    
    // Otherwise navigation will happen naturally through the Link
  };

  const handleDelete = async () => {
    // Use toast.promise for better UX
    toast.promise(
      async () => {
        setIsDeleting(true);
        try {
          const response = await deleteLessonPlan(plan.id);
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
        loading: 'Deleting lesson plan...',
        success: 'Lesson plan deleted successfully',
        error: (err) => `${err.message || 'Failed to delete lesson plan'}`
      }
    );
  };

  const handleEdit = () => {
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
      <Link href={`/teacher/dashboard/classes/${classCode}/lesson-plans/${plan.id}`} onClick={handleCardClick}>
        <Card className="bg-orange-400 w-[250px] h-[250px] rounded-xl relative cursor-pointer hover:shadow-lg transition-shadow">
          {/* Dropdown menu in the top-right corner */}
          <div className="absolute top-2 right-2 z-10 dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="bg-white/20 backdrop-blur-sm rounded-full p-1 hover:bg-white/40 transition-colors">
                <MoreHorizontal className="h-5 w-5 text-white" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit} disabled={isDeleting}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardContent className="flex items-center justify-center h-full">
            <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
          </CardContent>
        </Card>
      </Link>

      {/* Edit Dialog */}
      <EditLessonPlanDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
        lessonPlan={plan}
      />
    </>
  );
}
