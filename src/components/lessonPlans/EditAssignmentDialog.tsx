'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { updateAssignment } from '@/src/app/actions/assignmentActions';
import { toast } from 'sonner';
import { AssignmentRecord } from '@/src/types/assignments';
import { Loader2 } from 'lucide-react';

// Modify your EditAssignmentDialogProps to include the current lesson plan ID
interface EditAssignmentDialogProps {
  assignment: AssignmentRecord & {
    isVisible?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isGeneric?: boolean;
  currentLessonPlanId?: string; // Add this prop
}

// File-based assignment activity options
const fileActivityOptions = [
  { label: 'Homework', value: 'Homework' },
  { label: 'Writing Assignment', value: 'Writing Assignment' },
  { label: 'Worksheet', value: 'Worksheet' },
];

// Text-based assignment activity options  
const textActivityOptions = [
  { label: 'Short Answer', value: 'Short Answer' },
  { label: 'Discussion Question', value: 'Discussion Question' },
  { label: 'Reflection', value: 'Reflection' },
  { label: 'Quick Task', value: 'Quick Task' },
  { label: 'Reading Response', value: 'Reading Response' },

];

export default function EditAssignmentDialog({
  assignment,
  isOpen,
  onClose,
  onUpdate,
  isGeneric = false, // Optional prop to indicate if this is a generic assignment
  currentLessonPlanId = '' // Add this with a default empty string
}: EditAssignmentDialogProps) {
  const [form, setForm] = useState({
    name: '',
    activity: '',
    dueDate: '',
    textAssignment: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine if this is a text assignment
  const isTextAssignment = assignment.fileType === 'text';
  
  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    if (assignment) {
      setForm({
        name: assignment.name,
        activity: assignment.activity || '',
        dueDate: assignment.dueDate ? 
          new Date(assignment.dueDate).toISOString().split('T')[0] : '',
        textAssignment: assignment.textAssignment || ''
      });
    }
  }, [assignment]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get the lessonPlanIds from the assignment
      let lessonPlanIds: string[] = [];
      
      // For generic lesson plans, handle differently - check isGeneric prop
      if (isGeneric) {
        // For generic assignments, we'll pass an empty array or use the templateId if available
        // This indicates to the server action that it's a generic assignment
        if (assignment.genericLessonPlanId) {
          lessonPlanIds = [assignment.genericLessonPlanId];
        }
        // Even if no genericLessonPlanId, we'll continue without throwing an error
      } else {
        // Regular lesson plan logic - try to get lessonPlanIds from various sources
        // First, try to use the current lesson plan ID if provided
        if (currentLessonPlanId) {
          lessonPlanIds = [currentLessonPlanId];
        }
        // If not, try to get from the assignment object as before
        else if (assignment.lessonPlanIds && assignment.lessonPlanIds.length > 0) {
          lessonPlanIds = assignment.lessonPlanIds;
        } 
        else if (assignment.lessonPlans && assignment.lessonPlans.length > 0) {
          lessonPlanIds = assignment.lessonPlans.map(lp => lp.id);
        }
        
        // Now check if we have any lesson plans
        if (lessonPlanIds.length === 0) {
          throw new Error("No lesson plan found for this assignment");
        }
      }
      
      const result = await updateAssignment(assignment.id, {
        name: form.name,
        activity: form.activity,
        dueDate: form.dueDate || undefined,
        lessonPlanIds: lessonPlanIds,
        textAssignment: isTextAssignment ? form.textAssignment : undefined,
        // Include other required fields from the original assignment
        url: assignment.url || '',
        fileType: assignment.fileType || '',
        size: typeof assignment.size === 'string' ? parseInt(assignment.size) || 0 : assignment.size || 0,
        description: assignment.description
      });
      
      if (result.success) {
        toast.success('Assignment updated successfully');
        onUpdate();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update assignment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating assignment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get appropriate activity options based on assignment type
  const activityOptions = isTextAssignment ? textActivityOptions : fileActivityOptions;
  
  // Check if past date is selected
  const isPastDate = form.dueDate ? new Date(form.dueDate) < new Date(today) : false;

  // Calculate the visibility condition separately
  const shouldShowDueDate = assignment.dueDate || assignment.isVisible === true;

  console.log('Due date field visibility:', {
    condition: shouldShowDueDate,
    isGeneric,
    hasDueDate: Boolean(assignment.dueDate),
    isVisible: assignment.isVisible === true
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit {isTextAssignment ? 'Text Assignment' : 'Assignment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Assignment Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter assignment name"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="activity">Activity Type</Label>
            <select
              id="activity"
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
              disabled={isSubmitting}
            >
              <option value="">Select activity type</option>
              {activityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Show text assignment field if it's a text assignment */}
          {isTextAssignment && (
            <div className="space-y-2">
              <Label htmlFor="textAssignment">Assignment Text</Label>
              <Textarea
                id="textAssignment"
                value={form.textAssignment}
                onChange={(e) => setForm({ ...form, textAssignment: e.target.value })}
                placeholder="Assignment instructions..."
                disabled={isSubmitting}
                className="min-h-[100px] resize-none"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 text-right">
                {form.textAssignment.length}/1000 characters
              </div>
            </div>
          )}
          
          {/* Only show due date field if assignment already has a due date */}
          {shouldShowDueDate && (
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                disabled={isSubmitting}
                min={today} // Prevent selecting past dates
              />
              {isPastDate && (
                <p className="text-red-500 text-xs">Please select a future date</p>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.name.trim() || isPastDate}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}