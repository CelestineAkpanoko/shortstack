'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { updateAssignment } from '@/src/app/actions/assignmentActions';
import { toast } from 'sonner';
import { AssignmentRecord } from '@/src/types/assignments';

interface EditAssignmentDialogProps {
  assignment: AssignmentRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const activityOptions = [
  { label: 'Homework', value: 'Homework' },
  { label: 'Quiz', value: 'Quiz' },
  { label: 'Test', value: 'Test' },
  { label: 'Project', value: 'Project' },
  { label: 'Essay', value: 'Essay' },
  { label: 'Reading', value: 'Reading' },
  { label: 'Other', value: 'Other' }
];

export default function EditAssignmentDialog({
  assignment,
  isOpen,
  onClose,
  onUpdate
}: EditAssignmentDialogProps) {
  const [form, setForm] = useState({
    name: '',
    activity: '',
    dueDate: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (assignment) {
      setForm({
        name: assignment.name,
        activity: assignment.activity || '',
        dueDate: assignment.dueDate ? 
          new Date(assignment.dueDate).toISOString().split('T')[0] : ''
      });
    }
  }, [assignment]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await updateAssignment(assignment.id, {
        name: form.name,
        activity: form.activity,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
        classId: assignment.classId || "" // Add the classId from the assignment
      });
      
      if (result.success) {
        toast.success('Assignment updated successfully');
        onUpdate();
      } else {
        throw new Error(result.error || 'Failed to update assignment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating assignment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Assignment Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter assignment name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="activity">Activity Type</Label>
            <Select
              value={form.activity}
              onValueChange={(value) => setForm({ ...form, activity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {activityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}