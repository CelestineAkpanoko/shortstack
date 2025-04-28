'use client';

import { useState, useEffect } from 'react';
import { getAvailableStudents, addExistingStudentToClass } from '@/src/app/actions/studentActions';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { toast } from 'react-hot-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/src/components/ui/select';

interface ExistingStudentFormProps {
  classCode: string;
  onClose: () => void;
}

interface AvailableStudent {
  id: string;
  firstName: string;
  lastName: string;
  schoolEmail: string;
}

export function ExistingStudentForm({ classCode, onClose }: ExistingStudentFormProps) {
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAvailableStudents = async () => {
      try {
        setLoading(true);
        const result = await getAvailableStudents(classCode);
        if (result.success && result.data) {
          setStudents(result.data);
        } else {
          toast.error(result.error || 'Failed to load available students');
        }
      } catch (error) {
        console.error('Error loading students:', error);
        toast.error('Error loading students');
      } finally {
        setLoading(false);
      }
    };
  
    loadAvailableStudents();
  }, [classCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Pass student ID directly, not userId
      const result = await addExistingStudentToClass(selectedStudentId, classCode);
      
      if (result.success) {
        toast.success('Student added to class successfully');
        onClose();
      } else {
        toast.error(result.error || 'Failed to add student to class');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Error adding student to class');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading available students...</div>;
  }

  if (students.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>No available students found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          All students have already been added to this class or no students exist in the system.
        </p>
        <Button 
          variant="outline" 
          onClick={onClose} 
          className="mt-4"
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="student">Select Student</Label>
        <Select
          value={selectedStudentId}
          onValueChange={setSelectedStudentId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.firstName} {student.lastName} ({student.schoolEmail})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!selectedStudentId || submitting}
        >
          {submitting ? 'Adding...' : 'Add to Class'}
        </Button>
      </div>
    </form>
  );
}