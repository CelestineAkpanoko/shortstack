'use client';

import { Card, CardContent } from '@/src/components/ui/card';

interface StudentClassOverviewProps {
  classData: {
    id: string;
    name: string;
    code: string;
    emoji: string;
    overview?: string;
  };
}

export default function StudentClassOverview({ classData }: StudentClassOverviewProps) {
  return (
    <div className="space-y-4">
    <h2 className="text-xl font-semibold flex items-center"> Description </h2>
    <hr className="w-1/2 border-t-2 border-orange-500" />
    <div className="max-w-2xl w-full">
      {classData.overview ? (
        <div 
        dangerouslySetInnerHTML={{ __html: classData.overview }} 
        />
      ) : (
        <div className="text-center text-muted-foreground py-8">
        No class overview available yet.
        </div>
      )}
    </div>
    </div>
  );
}