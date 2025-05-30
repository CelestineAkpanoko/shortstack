'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { getAssignments } from '@/src/app/actions/assignmentActions';
import { Search, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import AssignmentCard from './AssignmentCard';
import AssignmentSubmissions from './AssignmentSubmissions';

interface GradebookProps {
  classCode: string;
}

interface Assignment {
  id: string;
  name: string;
  activity?: string;           
  dueDate?: string | null;     
  fileType: string;            
  size: number;                
  url: string;                 
  rubric?: string | null;      
  classId: string;             
  createdAt: string;          
  updatedAt: string;           
  
  lessonPlans?: Array<{
    id: string;
    name: string;
  }>;
  
  class?: {
    name: string;
    code: string;
    emoji?: string;
  };
  
  studentSubmissions?: Array<{
    id: string;
    status: string;
    grade?: number | null;
    studentId: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function Gradebook({ classCode }: GradebookProps) {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<{id: string, name: string} | null>(null); 
  
  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      try {
        const response = await getAssignments(classCode);
        if (response.success && response.data) {
          console.log('Loaded assignments:', response.data);
          setAssignments(response.data);
        } else {
          toast.error(response.error || 'Error loading assignments');
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        toast.error('Could not load assignments');
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [classCode]);

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(assignment => 
    assignment.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignmentSelect = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      setSelectedAssignment({ id: assignmentId, name: assignment.name });
    }
  };

  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading assignments...</p>
      </div>
    );
  }

  if (selectedAssignment) {
    return (
      <AssignmentSubmissions
        assignmentId={selectedAssignment.id}
        assignmentName={selectedAssignment.name}
        onBack={handleBackToAssignments}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Gradebook - Assignments</h2>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Assignments Grid - No tabs needed */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={{
                id: assignment.id,
                name: assignment.name,
                classId: assignment.classId,
              }}
              backgroundColor="bg-white"
              onSelect={handleAssignmentSelect} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No assignments found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm 
              ? `No assignments match "${searchTerm}"`
              : "No assignments have been created for this class yet."
            }
          </p>
        </div>
      )}
    </div>
  );
}