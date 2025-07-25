'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { useState, useEffect } from 'react';
import { copyAssignmentToLessonPlan } from '@/src/app/actions/assignmentActions';
import { getClasses } from '@/src/app/actions/classActions';
import { getLessonPlansByClass } from '@/src/app/actions/lessonPlansActions';
import { Loader2, Check } from 'lucide-react';
import { Checkbox } from '@/src/components/ui/checkbox';
import { toast } from 'sonner';

interface AssignmentRecord {
  id: string;
  name: string;
  fileType?: string;
  activity?: string;
  dueDate?: string;
  size?: number;
  url?: string;
  classId?: string;
}

interface ClassRecord {
  id: string;
  name: string;
  code: string;
}

interface LessonPlanRecord {
  id: string;
  name: string;
}

interface AssignAssignmentDialogProps {
  assignment: AssignmentRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function AssignAssignmentDialog({ 
  assignment,
  isOpen, 
  onClose, 
  onUpdate 
}: AssignAssignmentDialogProps) {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [lessonPlans, setLessonPlans] = useState<LessonPlanRecord[]>([]);
  const [selectedLessonPlans, setSelectedLessonPlans] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchClasses = async () => {
        try {
          setIsLoading(true);
          const result = await getClasses();
          if (result.success) {
            setClasses(result.data || []);
            // Select a default class other than the current one
            const otherClass = result.data.find((c: { code: string }) => c.code !== assignment.classId);
            if (otherClass) {
              setSelectedClass(otherClass.code);
            } else if (result.data.length > 0) {
              setSelectedClass(result.data[0].code);
            }
          }
        } catch (error) {
          console.error('Failed to fetch classes:', error);
          toast.error('Failed to fetch classes');
        } finally {
          setIsLoading(false);
        }
      }
      fetchClasses();
      // Reset selected lesson plans when dialog opens
      setSelectedLessonPlans([]);
    }
  }, [isOpen, assignment.classId]);

  // Fetch lesson plans when a class is selected
  useEffect(() => {
    const fetchLessonPlans = async () => {
      if (!selectedClass) return;
      
      setIsLoading(true);
      try {
        const result = await getLessonPlansByClass(selectedClass);
        if (result.success) {
          setLessonPlans(result.data || []);
        } else {
          setLessonPlans([]);
          toast.error('Failed to load lesson plans');
        }
      } catch (error) {
        console.error('Failed to fetch lesson plans:', error);
        setLessonPlans([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLessonPlans();
  }, [selectedClass]);

  const handleSubmit = async () => {
    if (selectedLessonPlans.length === 0) {
      setError("Please select at least one lesson plan");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Create a copy of the assignment for each selected lesson plan
      // Remove targetClassId as it doesn't exist in the interface
      const promises = selectedLessonPlans.map(lessonPlanId => 
        copyAssignmentToLessonPlan({
          sourceAssignmentId: assignment.id,
          targetLessonPlanId: lessonPlanId
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if any operation failed
      const failedResults = results.filter(r => !r.success);
      
      if (failedResults.length > 0) {
        setError(`Failed to assign assignment to ${failedResults.length} lesson plans`);
        toast.error(`Failed to assign assignment to ${failedResults.length} lesson plans`);
      } else {
        toast.success('Assignment assigned successfully to selected lesson plans');
        onUpdate();
        onClose();
      }
    } catch (error: any) {
      console.error('Error assigning assignment:', error);
      setError(error.message || 'Failed to assign assignment');
      toast.error('Failed to assign assignment');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleLessonPlan = (id: string) => {
    setSelectedLessonPlans(current => {
      if (current.includes(id)) {
        return current.filter(lpId => lpId !== id);
      } else {
        return [...current, id];
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Assignment to Additional Lesson Plans</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">
              A copy of this assignment will be assigned to the lesson plans you select below. The original assignment will remain unchanged.
            </p>
          </div>
          
          <div className="p-2 border rounded bg-gray-50">
            <p className="font-medium">{assignment.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Class
            </label>
            <select 
              className="border p-2 w-full rounded" 
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedLessonPlans([]);
              }}
              disabled={isLoading || isUpdating}
            >
              <option value="" disabled>Select a class</option>
              {classes.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} {c.code === assignment.classId ? '(Current Class)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Select Lesson Plans to Add This Assignment To
            </label>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : lessonPlans.length === 0 ? (
              <p className="text-sm text-gray-500 p-2">
                No lesson plans found for this class.
              </p>
            ) : (
              <div className="max-h-60 overflow-auto border rounded p-2">
                {lessonPlans.map(lp => (
                  <div key={lp.id} className="flex items-center space-x-2 py-1">
                    <Checkbox 
                      id={`lp-${lp.id}`}
                      checked={selectedLessonPlans.includes(lp.id)}
                      onCheckedChange={() => toggleLessonPlan(lp.id)}
                      disabled={isUpdating}
                    />
                    <label 
                      htmlFor={`lp-${lp.id}`}
                      className="text-sm cursor-pointer select-none"
                    >
                      {lp.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={isUpdating || isLoading || selectedLessonPlans.length === 0}
              className="min-w-[80px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Assign
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}