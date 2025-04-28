'use client';

import { useState, useEffect } from 'react';
import { getStudentsByClass } from '@/src/app/actions/studentActions';
import { AddStudentForm } from './AddStudentForm';
import { EditStudentForm } from './EditStudentForm'; 
import { ExistingStudentForm } from './ExistingStudentForm';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/src/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Badge } from '@/src/components/ui/badge';
import { DeleteStudentDialog } from './DeleteStudentDialog';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  schoolEmail: string;
  progress: number;
  enrolled: boolean;
  schoolName?: string; // Add this property
}

interface StudentListProps {
  classCode: string;
  maxStudents: number;
}

export function StudentList({ classCode, maxStudents = Infinity }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [enrollmentStats, setEnrollmentStats] = useState({ total: 0, enrolled: 0 });
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  console.log("StudentList received classCode:", classCode);

  const loadStudents = async () => {
    if (!classCode) {
      console.error("Missing class code in StudentList");
      toast.error("Configuration error: Missing class code");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log("Fetching students for class:", classCode);
      const result = await getStudentsByClass(classCode);
      
      console.log("Student fetch result:", result);
      
      if (!result) {
        console.error("getStudentsByClass returned null or undefined");
        toast.error("Failed to load students: Server returned no data");
        setLoading(false);
        return;
      }
      
      if (result.success && result.data) {
        if (result.data.students && result.data.enrollmentStats) {
          setStudents(result.data.students);
          setEnrollmentStats(result.data.enrollmentStats);
        } else if (Array.isArray(result.data)) {
          setStudents(result.data);
          const totalStudents = result.data.length;
          const enrolledStudents = result.data.filter(s => s.enrolled).length;
          setEnrollmentStats({ 
            total: totalStudents, 
            enrolled: enrolledStudents 
          });
        } else if (result.data.enrollmentStats) {
          setStudents(result.data.students);
          setEnrollmentStats(result.data.enrollmentStats);
        }
      } else {
        console.error("Student fetch error:", result.error || "Unknown error");
        toast.error(result.error || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Error loading students. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [classCode]);

  const handleDelete = (student: Student) => {
    setStudentToDelete(student);
  };

  const handleOpenAddDialog = () => {
    if (!classCode) {
      toast.error("Missing class code, cannot add students");
      return;
    }
    setShowAddDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-md font-semibold flex items-center gap-2">
            Students 
            <Badge variant="outline" className="text-xs py-1">
              {enrollmentStats.enrolled}/{enrollmentStats.total} enrolled
            </Badge>
          </h4>
          <p className="text-sm text-muted-foreground">
            Manage students and track enrollments
          </p>
        </div>
        <button
          onClick={handleOpenAddDialog}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 cursor-pointer"
        >
          Add Student
        </button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
          </DialogHeader>
          
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-xs text-muted-foreground mb-2">
              Debug: Using class code: {classCode}
            </div>
          )}
          
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Student</TabsTrigger>
              <TabsTrigger value="existing">Existing Student</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              <AddStudentForm
                classCode={classCode}
                maxStudents={Infinity} 
                currentStudentCount={students.length}
                onClose={() => {
                  setShowAddDialog(false);
                  loadStudents();
                }}
              />
            </TabsContent>
            
            <TabsContent value="existing">
              <ExistingStudentForm
                classCode={classCode}
                onClose={() => {
                  setShowAddDialog(false);
                  loadStudents();
                }}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingStudent} onOpenChange={(open) => {
        if (!open) setEditingStudent(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <EditStudentForm
              classCode={classCode}
              student={{
                ...editingStudent,
                schoolName: (editingStudent as any)?.schoolName || ''
              }}
              onClose={() => {
                setEditingStudent(null);
                loadStudents();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {students.length === 0 ? (
        <div className="bg-muted/30 rounded-md p-8 text-center">
          <p className="text-gray-500">
            No students yet. Add your first student!
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4">{student.firstName} {student.lastName}</td>
                  <td className="px-6 py-4">{student.schoolEmail}</td>
                  <td className="px-6 py-4">
                    {student.enrolled ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        Enrolled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{student.progress}%</span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteStudentDialog
        open={!!studentToDelete}
        onOpenChange={(open) => {
          if (!open) setStudentToDelete(null);
        }}
        studentId={studentToDelete?.id || ''}
        studentName={studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName}` : ''}
        classCode={classCode}
        onSuccess={loadStudents}
      />
    </div>
  );
}