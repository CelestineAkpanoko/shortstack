'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Download, FileText, Image as ImageIcon, Video, File, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

interface SubmissionReviewDialogProps {
  submission: Submission;
  isOpen: boolean;
  onClose: () => void;
  onGrade: (submissionId: string, grade: number, feedback?: string) => Promise<void>;
  isGrading: boolean;
}

export default function SubmissionReviewDialog({
  submission,
  isOpen,
  onClose,
  onGrade,
  isGrading
}: SubmissionReviewDialogProps) {
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.comments || '');

  const handleSave = async () => {
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      toast.error('Grade must be a number between 0 and 100');
      return;
    }
    
    try {
      await onGrade(submission.id, gradeNum, feedback);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleDownload = () => {
    if (submission.fileUrl) {
      window.open(submission.fileUrl, '_blank');
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-6 w-6" />;
    
    if (fileType.startsWith('image/')) return <ImageIcon className="h-6 w-6" />;
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (size: number | null) => {
    if (!size) return 'Unknown size';
    
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${Math.round(size / (1024 * 1024))} MB`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'secondary';
      case 'GRADED': return 'default';
      case 'LATE': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={submission.student.profileImage || ''} />
              <AvatarFallback>
                {submission.student.firstName.charAt(0)}{submission.student.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-lg">
                {submission.student.firstName} {submission.student.lastName}'s Submission
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusBadgeVariant(submission.status)}>
                  {submission.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Submitted {format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Submission Section */}
          {submission.fileUrl && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">File Submission</h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-600">
                  {getFileIcon(submission.fileType ?? null)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{submission.fileName || 'Submitted File'}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{submission.fileType || 'Unknown type'}</span>
                    <span>•</span>
                    <span>{formatFileSize(submission.fileSize ?? null)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* Preview for images */}
              {submission.fileType?.startsWith('image/') && (
                <div className="mt-3">
                  <img 
                    src={submission.fileUrl} 
                    alt="Submission preview"
                    className="max-w-full max-h-64 object-contain rounded border"
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Text Submission Section */}
          {submission.textContent && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Text Submission</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {submission.textContent}
                </p>
              </div>
            </div>
          )}

          {/* No Submission Message */}
          {!submission.fileUrl && !submission.textContent && (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No content submitted</p>
            </div>
          )}

          {/* Grading Section */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold mb-4">Grade Submission</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade">Grade (0-100)</Label>
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Enter grade (0-100)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter feedback for the student..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            {/* Current Grade Display */}
            {submission.grade !== null && submission.grade !== undefined && (
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="text-sm text-gray-600">Current Grade:</p>
                <p className="text-lg font-semibold text-green-600">{submission.grade}%</p>
                {submission.comments && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Previous Feedback:</p>
                    <p className="text-sm">{submission.comments}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isGrading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isGrading}>
            <Save className="h-4 w-4 mr-2" />
            {isGrading ? 'Saving...' : 'Save Grade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}