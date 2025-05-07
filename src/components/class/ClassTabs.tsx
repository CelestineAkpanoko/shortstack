'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { StudentList } from '../students/StudentList';
// import { LessonPlans} from '@/src/components/class/LessonPlans';
import LessonPlansList  from '@/src/components/lessonPlans/LessonPlansList';
import ClassOverview from './ClassOverview';

interface ClassTabsProps {
  classData: {
    id: string;
    name: string;
    code: string;
    students: any[];
    overview?: string | null;
  };
}

export default function ClassTabs({ classData }: ClassTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="lessonPlans">Lesson Plans</TabsTrigger>
        <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ClassOverview classData={{ ...classData, overview: classData.overview ?? undefined }} />
      </TabsContent>


      <TabsContent value="lessonPlans">
        <LessonPlansList classCode={classData.code} cName={classData.name} />
      </TabsContent>

      <TabsContent value="gradebook">
        <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
          Gradebook feature coming soon
        </div>
      </TabsContent>
    </Tabs>
  );
}