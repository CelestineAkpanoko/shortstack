"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import StudentClassOverview from "./StudentClassOverview";
import StudentLessonsList from "./StudentLessonsList";
import StudentGrades from './StudentGrades';
import { useSession } from "next-auth/react";

interface StudentClassTabsProps {
  classData: {
    id: string;
    name: string;
    code: string;
    emoji: string;
    overview?: string | null;
    lessonPlans?: any[];
  };
}

export default function StudentClassTabs({ classData }: StudentClassTabsProps) {
  const { data: session } = useSession();

  // Ensure the student is authenticated
  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <Tabs defaultValue="overview" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="lessons">Lessons</TabsTrigger>
        <TabsTrigger value="grades">My Grades</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <StudentClassOverview
          classData={{
            ...classData,
            overview: classData.overview ?? undefined,
          }}
        />
      </TabsContent>

      <TabsContent value="lessons">
        <StudentLessonsList
          classCode={classData.code}
          classId={classData.id}
          lessonPlans={classData.lessonPlans || []}
        />
      </TabsContent>

      <TabsContent value="grades">
        <StudentGrades classCode={classData.code} studentId={session.user.id} />
      </TabsContent>
    </Tabs>
  );
}
