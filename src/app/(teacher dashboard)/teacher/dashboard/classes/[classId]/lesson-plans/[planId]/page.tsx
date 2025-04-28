// app/dashboard/classes/[classId]/[planId]/page.tsx
import LessonPlanDetailPage from './LessonPlanDetailPage';

interface PageProps {
  params: Promise<{ classId: string; planId: string }>;
}

export default async function Page({ params }: PageProps) {
  // Await the params before destructuring
  const { classId, planId } = await params;

  // Render the client component, passing in classId & planId as props
  return (
    <LessonPlanDetailPage classId={classId} planId={planId} />
  );
}