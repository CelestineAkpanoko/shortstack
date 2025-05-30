import LessonPlanDetailView from './LessonPlanDetailView';

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export default async function Page({ params }: PageProps) {
  // Await the params before destructuring
  const { lessonId } = await params;

  // Render the client component, passing in lessonId as prop
  return (
    <LessonPlanDetailView lessonId={lessonId} />
  );
}