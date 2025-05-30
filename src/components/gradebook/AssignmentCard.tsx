'use client';

import { Card, CardContent } from '@/src/components/ui/card';

interface AssignmentCardProps {
  assignment: {
    id: string;
    name: string;
    classId?: string;
  };
  backgroundColor: string;
  onSelect: (assignmentId: string) => void; 
}

export default function AssignmentCard({ 
  assignment, 
  backgroundColor,
  onSelect,
}: AssignmentCardProps) {

  const handleClick = () => {
    onSelect(assignment.id); 
  };

  return (
    <Card 
      className={`${backgroundColor} w-[250px] h-[250px] rounded-xl relative cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-300`}
      onClick={handleClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full p-4">
        <h1 className="text-2xl font-bold text-black text-center line-clamp-3">
          {assignment.name}
        </h1>
      </CardContent>
    </Card>
  );
}