'use client';

import { Card, CardContent } from '@/src/components/ui/card';
import { Plus } from 'lucide-react';

interface AddLessonPlanCardProps {
  onClick: () => void;
}

export default function AddLessonPlanCard({ onClick }: AddLessonPlanCardProps) {
  return (
    <Card
      className="border-4 border-solid border-gray-400 w-[250px] h-[250px] rounded-xl bg-muted/80 flex flex-col justify-center items-center cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center w-full h-full">
        <div className="rounded-full bg-primary/35 p-2 text-primary/40 w-[100px] h-[100px] hover:bg-primary/50 transition-colors duration-300 ease-in-out">
          <Plus className="w-full h-full items-center justify-center" />
        </div>
      </CardContent>
      <CardContent>
        <span className="flex items-center justify-center w-[130px] h-[20px] rounded-xl bg-primary/10 text-primary/60">
          Add Lesson Plan
        </span>
      </CardContent>
    </Card>
  );
}
