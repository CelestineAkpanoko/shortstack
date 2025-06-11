'use client';

import { useEffect, useState } from 'react';
import { getLessonPlansByClass } from '@/src/app/actions/lessonPlansActions';
import  LessonPlanCard from '@/src/components/lessonPlans/LessonPlanCard';
import AddLessonPlanCard from '@/src/components/lessonPlans/AddLessonPlanCard';
import AssignLessonPlanDialog from '@/src/components/lessonPlans/AssignLessonPlanDialog';
import Breadcrumbs from '@/src/components/Breadcrumbs';

interface LessonPlansListProps {
  classCode: string;
  cName: string;
}

interface AssignLessonPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classCode: string;
  className: string;
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
              onUpdate={fetchLessonPlans} // Pass the fetch function to update when changes happen
              backgroundColor={''}            />
          ))}
          <AddLessonPlanCard onClick={() => setIsDialogOpen(true)} />
        </div>
      )}
      <AssignLessonPlanDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        classCode={classCode}
        className={cName}
        onSuccess={fetchLessonPlans}
      />
    </div>
  );
}
