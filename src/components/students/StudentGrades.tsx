'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  getStudentGrades 
} from '@/src/app/actions/gradebookActions';
import { Loader2, FileCheck, CheckCircle2, Clock, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface StudentGradesProps {
  classCode: string;
  studentId: string;
}

interface Assignment {
  id: string;
  name: string;
  fileType: string;
  dueDate: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  grade: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignment: Assignment;
}

export default function StudentGrades({ classCode, studentId }: StudentGradesProps) {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  useEffect(() => {
    const loadGradesData = async () => {
      setLoading(true);
      try {
        console.log("Loading grades data for class:", classCode);
        const response = await getStudentGrades(classCode);
        console.log("Response received:", response);
        
        if (response.success) {
          setAssignments(response.data.assignments || []);
          setSubmissions(response.data.submissions || []);
          
          console.log("Data loaded:", {
            assignments: response.data.assignments?.length || 0,
            submissions: response.data.submissions?.length || 0,
          });
        } else {
          toast.error(response.error || 'Error loading grades data');
        }
      } catch (error) {
        console.error('Error fetching grades data:', error);
        toast.error('Could not load grades');
      } finally {
        setLoading(false);
      }
    };

    loadGradesData();
  }, [classCode]);

  const getStatusBadge = (status: string, grade: number | null) => {
    if (grade !== null && grade !== undefined) {
      return <Badge variant="outline" className="bg-green-50"><CheckCircle2 className="w-3 h-3 mr-1" /> Graded</Badge>;
    }
    
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
      case 'RETURNED':
        return <Badge variant="outline" className="bg-blue-50"><FileCheck className="w-3 h-3 mr-1" /> Returned</Badge>;
      case 'GRADED':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle2 className="w-3 h-3 mr-1" /> Graded</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50"><AlertTriangle className="w-3 h-3 mr-1" /> Not Submitted</Badge>;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateOverallGrade = () => {
    const gradedSubmissions = submissions.filter(sub => sub.grade !== null && sub.grade !== undefined);
    if (gradedSubmissions.length === 0) return null;
    
    const total = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
    return Math.round(total / gradedSubmissions.length);
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(sub => sub.assignmentId === assignmentId);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overallGrade = calculateOverallGrade();
  const gradedCount = submissions.filter(sub => sub.grade !== null && sub.grade !== undefined).length;
  const totalAssignments = assignments.length;

  return (
    <div className="w-full space-y-4">
      {/* Header with overall grade */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3">
        <h2 className="text-lg font-semibold">My Grades</h2>
        {overallGrade !== null && (
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getGradeColor(overallGrade)}`}>
                {overallGrade}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Grade</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{gradedCount}/{totalAssignments}</div>
              <div className="text-sm text-muted-foreground">Graded</div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="assignments">All Assignments</TabsTrigger>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignments">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead className="text-center">Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length > 0 ? (
                  assignments.map(assignment => {
                    const submission = getSubmissionForAssignment(assignment.id);
                    const overdue = isOverdue(assignment.dueDate) && !submission;
                    
                    return (
                      <TableRow key={assignment.id} className={overdue ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{assignment.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {assignment.fileType}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className={overdue ? 'text-red-600 font-medium' : ''}>
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          {getStatusBadge(submission?.status || 'NOT_SUBMITTED', submission?.grade || null)}
                        </TableCell>
                        
                        <TableCell className="text-center">
                          {submission?.grade !== null && submission?.grade !== undefined ? (
                            <span className={`font-bold text-lg ${getGradeColor(submission.grade)}`}>
                              {submission.grade}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-center">
                          {submission?.createdAt ? (
                            <span className="text-sm text-muted-foreground">
                              {new Date(submission.createdAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No assignments found for this class
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Overall Progress Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Assignments Completed</span>
                      <span>{gradedCount}/{totalAssignments}</span>
                    </div>
                    <Progress 
                      value={totalAssignments > 0 ? (gradedCount / totalAssignments) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  {overallGrade !== null && (
                    <div className="text-center pt-2">
                      <div className={`text-3xl font-bold ${getGradeColor(overallGrade)}`}>
                        {overallGrade}%
                      </div>
                      <div className="text-sm text-muted-foreground">Current Average</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grade Distribution Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Grade Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {submissions
                    .filter(sub => sub.grade !== null && sub.grade !== undefined)
                    .map(submission => (
                      <div key={submission.id} className="flex justify-between items-center">
                        <span className="text-sm truncate mr-2">{submission.assignment.name}</span>
                        <Badge variant={(submission.grade ?? 0) >= 80 ? 'default' : 'secondary'}>
                          {submission.grade}%
                        </Badge>
                      </div>
                    ))}
                  {submissions.filter(sub => sub.grade !== null && sub.grade !== undefined).length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No graded assignments yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Assignments Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upcoming & Missing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assignments
                    .filter(assignment => !getSubmissionForAssignment(assignment.id))
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 5)
                    .map(assignment => {
                      const overdue = isOverdue(assignment.dueDate);
                      return (
                        <div key={assignment.id} className="flex justify-between items-center">
                          <span className="text-sm truncate mr-2">{assignment.name}</span>
                          <Badge variant={overdue ? 'destructive' : 'outline'}>
                            {overdue ? 'Overdue' : 'Pending'}
                          </Badge>
                        </div>
                      );
                    })}
                  {assignments.filter(assignment => !getSubmissionForAssignment(assignment.id)).length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      All assignments submitted!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}