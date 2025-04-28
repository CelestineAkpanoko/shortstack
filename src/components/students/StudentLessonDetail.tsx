'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { ExternalLink, FileText, Calendar, Download } from 'lucide-react';
import { formatDate } from '@/src/lib/utils';

interface StudentLessonDetailProps {
  lessonData: {
    id: string;
    name: string;
    description?: string;
    content?: string;
    createdAt: string;
    files: any[];
    assignments: any[];
    class: {
      name: string;
      code: string;
      emoji: string;
    };
  };
}

export default function StudentLessonDetail({ lessonData }: StudentLessonDetailProps) {
  return (
    <div className="space-y-6">
      {/* Lesson Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Content</CardTitle>
        </CardHeader>
        <CardContent>
          {lessonData.content ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: lessonData.content }} 
            />
          ) : (
            lessonData.description ? (
              <p>{lessonData.description}</p>
            ) : (
              <p className="text-muted-foreground">No content available for this lesson.</p>
            )
          )}
        </CardContent>
      </Card>

      {/* Assignments */}
      {lessonData.assignments && lessonData.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lessonData.assignments.map((assignment) => (
                <div key={assignment.id} className="bg-muted/20 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {assignment.name}
                      </h3>
                      
                      {assignment.activity && (
                        <p className="text-sm mt-1">{assignment.activity}</p>
                      )}
                      
                      {assignment.dueDate && (
                        <div className="flex items-center gap-1 text-sm font-medium mt-2 text-amber-500">
                          <Calendar className="h-4 w-4" />
                          Due: {formatDate(new Date(assignment.dueDate))}
                        </div>
                      )}
                    </div>
                    
                    {assignment.url && (
                      <a href={assignment.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" /> Open
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials/Files */}
      {lessonData.files && lessonData.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lessonData.files.map((file) => (
                <div key={file.id} className="flex justify-between items-center p-2 hover:bg-muted/20 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.fileType} • {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" /> Open
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}