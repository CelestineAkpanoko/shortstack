'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { ChevronLeft, Download, FileText, Eye } from 'lucide-react';
import { getAssignmentSubmissions, gradeSubmission } from '@/src/app/actions/assignmentActions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SubmissionReviewDialog from './SubmissionReviewDialog';

interface AssignmentSubmissionsProps {
  assignmentId: string;
  assignmentName: string;
  onBack: () => void;
}

interface Submission {
  id: string;
  grade?: number | null;
  status: string;
  fileUrl?: string | null;
  textContent?: string | null;
  comments?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string | null;
  };
}

export default function AssignmentSubmissions({ 
  assignmentId, 
  assignmentName, 
  onBack 
}: AssignmentSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [assignmentId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await getAssignmentSubmissions(assignmentId);
      if (response.success && response.data) {
        setSubmissions(response.data);
      } else {
        toast.error(response.error || 'Failed to load submissions');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Could not load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback?: string) => {
    setGradingSubmission(submissionId);
    try {
      const response = await gradeSubmission({
        submissionId,
        grade,
        feedback,
      });

      if (response.success) {
        toast.success('Grade saved successfully');
        await loadSubmissions(); // Refresh submissions
      } else {
        toast.error(response.error || 'Failed to save grade');
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Could not save grade');
    } finally {
      setGradingSubmission(null);
    }
  };

  const handleReviewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setIsReviewDialogOpen(false);
    setSelectedSubmission(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'secondary';
      case 'GRADED': return 'default';
      case 'LATE': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-2 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Assignments</span>
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{assignmentName}</h2>
          <p className="text-muted-foreground">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <SubmissionRow
                    key={submission.id}
                    submission={submission}
                    onReview={() => handleReviewSubmission(submission)}
                    isGrading={gradingSubmission === submission.id}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No submissions yet</h3>
              <p className="text-gray-500">Students haven't submitted this assignment yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {selectedSubmission && (
        <SubmissionReviewDialog
          submission={selectedSubmission}
          isOpen={isReviewDialogOpen}
          onClose={handleCloseReviewDialog}
          onGrade={handleGradeSubmission}
          isGrading={gradingSubmission === selectedSubmission.id}
        />
      )}
    </div>
  );
}

// Individual submission row component
function SubmissionRow({ 
  submission, 
  onReview,
  isGrading 
}: {
  submission: Submission;
  onReview: () => void;
  isGrading: boolean;
}) {
  const handleDownload = () => {
    if (submission.fileUrl) {
      window.open(submission.fileUrl, '_blank');
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'SUBMITTED': return 'secondary';
      case 'GRADED': return 'default';
      case 'LATE': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <TableRow>
      {/* Student */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={submission.student.profileImage || ''} />
            <AvatarFallback>
              {submission.student.firstName.charAt(0)}{submission.student.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {submission.student.firstName} {submission.student.lastName}
            </p>
            {submission.fileName && (
              <p className="text-xs text-gray-500 truncate max-w-32">
                {submission.fileName}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={getStatusBadgeVariant(submission.status)}>
          {submission.status}
        </Badge>
      </TableCell>

      {/* Submitted Date */}
      <TableCell>
        <div>
          <p className="text-sm">{format(new Date(submission.createdAt), 'MMM d, yyyy')}</p>
          <p className="text-xs text-gray-500">{format(new Date(submission.createdAt), 'HH:mm')}</p>
        </div>
      </TableCell>

      {/* Grade */}
      <TableCell>
        <div>
          <span className={`font-medium ${submission.grade !== null ? 'text-green-600' : 'text-gray-400'}`}>
            {submission.grade !== null ? `${submission.grade}%` : 'Not graded'}
          </span>
          {submission.comments && (
            <p className="text-xs text-gray-500 line-clamp-1 max-w-24">
              {submission.comments}
            </p>
          )}
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-2">
          {submission.fileUrl && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReview}
            disabled={isGrading}
          >
            <Eye className="h-4 w-4 mr-1" />
            {isGrading ? 'Grading...' : 'Review & Grade'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}