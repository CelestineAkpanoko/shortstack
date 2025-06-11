'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { useToast } from '@/src/hooks/use-toast';
import { getLessonPlans, assignExistingLessonPlan } from '@/src/app/actions/lessonPlansActions';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LessonPlan {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  class?: {
    name: string;
    emoji: string;
    code: string;
    grade?: string;
  };
  grade?: string;
}

interface AssignLessonPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classCode: string;
  className: string;
}

export default function AssignLessonPlanDialog({
  isOpen,
  onClose,
  onSuccess,
  classCode,
  className
}: AssignLessonPlanDialogProps) {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's lesson plans
  useEffect(() => {
    const fetchLessonPlans = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await getLessonPlans();
        
        if (result.success && result.data) {
          // Filter out lesson plans that are already assigned to the current class
          const availablePlans = result.data.filter((plan: LessonPlan) => 
            plan.class?.code !== classCode
          );
          setLessonPlans(availablePlans);
        } else {
          setError(result.error || "Failed to fetch lesson plans");
        }
      } catch (error) {
        setError("Failed to load lesson plans");
        console.error("Error fetching lesson plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonPlans();
  }, [isOpen, classCode]);

  // Update custom name when a plan is selected
  useEffect(() => {
    if (selectedPlanId) {
      const selectedPlan = lessonPlans.find(plan => plan.id === selectedPlanId);
      if (selectedPlan) {
        setCustomName(selectedPlan.name);
      }
    } else {
      setCustomName('');
    }
  }, [selectedPlanId, lessonPlans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!selectedPlanId) {
      setError('Please select a lesson plan to assign');
      setIsSubmitting(false);
      return;
    }

    if (!customName.trim()) {
      setError('Please provide a name for the assigned lesson plan');
      setIsSubmitting(false);
      return;
    }

    try {
      // ✅ Use assignExistingLessonPlan instead of copyGenericLessonPlanToUser
      const result = await assignExistingLessonPlan(
        selectedPlanId,    // This is a regular lesson plan ID
        classCode,         // Target class code
        customName         // Custom name for the copy
      );

      if (result.success) {
        toast.success(`"${customName}" has been assigned to ${className}`);
        onSuccess();
        handleClose();
      } else {
        setError(result.error || "Failed to assign lesson plan");
      }
    } catch (error) {
      setError("Failed to assign lesson plan");
      console.error("Error assigning lesson plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPlanId('');
    setCustomName('');
    setError(null);
    onClose();
  };

  const selectedPlan = lessonPlans.find(plan => plan.id === selectedPlanId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Lesson Plan</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : lessonPlans.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">
              No lesson plans available to assign. Create some lesson plans first or all your lesson plans are already assigned to this class.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show current class (read-only) */}
            <div className="space-y-2">
              <Label>Assign to Class</Label>
              <div className="px-3 py-2 bg-muted rounded-md border border-input">
                <span className="text-sm font-medium">{className}</span>
                <span className="text-xs text-muted-foreground ml-2">({classCode})</span>
              </div>
            </div>

            {/* Lesson Plan Selection */}
            <div className="space-y-2">
              <Label htmlFor="lessonPlan">Select Lesson Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lesson plan to assign" />
                </SelectTrigger>
                <SelectContent>
                  {lessonPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center gap-2">
                        {plan.class?.emoji && <span>{plan.class.emoji}</span>}
                        <span>{plan.name}</span>
                        {plan.class?.name && (
                          <span className="text-xs text-muted-foreground">
                            from {plan.class.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Name Input */}
            {/* {selectedPlanId && (
              <div className="space-y-2">
                <Label htmlFor="customName">Lesson Plan Name</Label>
                <Input
                  id="customName"
                  placeholder="Enter name for the assigned lesson plan"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You can customize the name for this class
                </p>
              </div>
            )} */}

            {/* Show selected plan details */}
            {selectedPlan && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium">Selected lesson plan:</p>
                <p className="mt-1">{selectedPlan.name}</p>
                {selectedPlan.description && (
                  <p className="mt-1 text-muted-foreground">{selectedPlan.description}</p>
                )}
                {selectedPlan.class && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    From: {selectedPlan.class.emoji} {selectedPlan.class.name}
                    {selectedPlan.class.grade && ` (${selectedPlan.class.grade})`}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Created: {new Date(selectedPlan.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {error && (
              <div className="px-2 py-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isSubmitting || 
                  !selectedPlanId || 
                  !customName.trim()
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Add Lesson Plan'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}