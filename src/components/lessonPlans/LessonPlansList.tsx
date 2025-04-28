'use client';

import { useEffect, useState } from 'react';
import { getLessonPlansByClass } from '@/src/app/actions/lessonPlansActions';
import  LessonPlanCard from '@/src/components/lesson_plans/LessonPlanCard';
import AddLessonPlanCard from '@/src/components/lesson_plans/AddLessonPlanCard';
import AddLessonPlanDialog from '@/src/components/lesson_plans/AddLessonPlanDialog';
import Breadcrumbs from '@/src/components/Breadcrumbs';

interface LessonPlansListProps {
  classCode: string;
  cName: string;
}

export default function LessonPlansList({ classCode, cName }: LessonPlansListProps) {
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLessonPlans = async () => {
    const response = await getLessonPlansByClass(classCode);
    if (response.success) {
      setLessonPlans(response.data);
    } else {
      setLessonPlans([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLessonPlans();
  }, [classCode]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/teacher/dashboard' },
          { label: cName, href: `/teacher/dashboard/classes/${classCode}` },
          { label: 'Lesson Plans', href: `/teacher/dashboard/classes/${classCode}/lesson-plans` },
        ]}
      />
      <h2 className="text-xl font-semibold">Lesson Plans</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {lessonPlans.map((plan) => (
            <LessonPlanCard 
              key={plan.id} 
              plan={plan} 
              classCode={classCode}
              onUpdate={fetchLessonPlans} // Pass the fetch function to update when changes happen
            />
          ))}
          <AddLessonPlanCard onClick={() => setIsDialogOpen(true)} />
        </div>
      )}
      <AddLessonPlanDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        classCode={classCode}
        onSuccess={fetchLessonPlans}
      />
    </div>
  );
}
