'use client';

import { Card, CardContent } from '@/src/components/ui/card';

interface AssignmentCardProps {
  assignment: {
    id: string;
    name: string;
    classId?: string;
    averageGrade?: number | null;
    lessonPlanName?: string | null;
    totalSubmissions?: number;
  };
  backgroundColor: string;
  onSelectAction: (assignmentId: string) => void; 
}

export default function AssignmentCard({ 
  assignment, 
  backgroundColor,
  onSelectAction,
}: AssignmentCardProps) {

  const handleClick = () => {
    onSelectAction(assignment.id); 
  };

  return (
    <Card 
      className={`${backgroundColor} w-[250px] h-[280px] rounded-xl relative cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-300`}
      onClick={handleClick}
    >
      <CardContent className="flex flex-col justify-between h-full p-4">
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-lg font-bold text-black text-center line-clamp-3">
            {assignment.name}
          </h1>
        </div>
        
        <div className="space-y-2 mt-4">
          {assignment.lessonPlanName && (
            <div className="bg-blue-50 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-600 font-medium">Lesson Plan</p>
              <p className="text-sm text-blue-800 truncate">{assignment.lessonPlanName}</p>
            </div>
          )}
          
          {assignment.averageGrade !== null && assignment.averageGrade !== undefined && (
            <div className="bg-green-50 rounded-lg px-3 py-2 flex justify-between items-center">
              <div>
                <p className="text-xs text-green-600 font-medium">Average Score</p>
                <p className="text-lg font-bold text-green-800">{assignment.averageGrade}%</p>
              </div>
              {assignment.totalSubmissions && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">{assignment.totalSubmissions}</p>
                  <p className="text-xs text-gray-500">submissions</p>
                </div>
              )}
            </div>
          )}
          
          {(assignment.averageGrade === null || assignment.averageGrade === undefined) && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-gray-500">No grades yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}