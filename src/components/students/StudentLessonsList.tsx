'use client';

import { Card, CardContent } from '@/src/components/ui/card';
import Link from 'next/link';
import { Book } from 'lucide-react';
import { formatDate } from '@/src/lib/utils';

interface StudentLessonsListProps {
  classCode: string;
  classId: string;
  lessonPlans: any[];
}

export default function StudentLessonsList({ classCode, classId, lessonPlans }: StudentLessonsListProps) {
  if (!lessonPlans || lessonPlans.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/20 rounded-md">
        <p className="text-muted-foreground">No lessons available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {lessonPlans.map((lesson) => (
          <Link 
            href={`/student/dashboard/classes/${classCode}/lessons/${lesson.id}`}
            key={lesson.id}
          >
            <Card className="bg-primary/10 w-[200px] h-[200px] rounded-xl relative cursor-pointer hover:shadow-lg transition-shadow overflow-hidden border-2 border-primary/20">
              <div className="absolute top-0 left-0 right-0 bg-primary/20 p-2 flex items-center">
                <Book className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium truncate">
                  {lesson.createdAt ? formatDate(new Date(lesson.createdAt)) : 'No date'}
                </span>
              </div>
              
              <CardContent className="flex flex-col justify-center items-center h-full pt-10">
                <h3 className="text-xl font-bold text-center">{lesson.name}</h3>
                
                
                <div className="mt-auto w-full flex justify-between items-center text-xs text-muted-foreground pt-4">
                  <span>{lesson.assignments?.length || 0} assignments</span>
                  <span>{lesson.files?.length || 0} materials</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}