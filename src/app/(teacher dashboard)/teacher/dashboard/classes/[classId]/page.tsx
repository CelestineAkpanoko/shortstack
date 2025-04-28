import { getClassData } from '@/src/app/actions/classActions';
import ClassTabs from '@/src/components/class/ClassTabs';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const result = await getClassData(classId);
  
  if (!result?.success || !result.data) {
    notFound();
  }

  // Fix: Make sure classData contains the class code and is properly structured
  const classData = {
    ...result.data,
    code: classId, // Ensure the code is explicitly set
    students: result.data.students || []
  };

  return (
    <main className="container mx-auto p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">
            {classData.emoji} {classData.name}
          </h1>
          <ClassTabs classData={classData} />
        </div>
      </Suspense>
    </main>
  );
}