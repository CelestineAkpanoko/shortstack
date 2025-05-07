import { getGenericLessonPlans } from "@/src/app/actions/lessonPlansActions";
import LessonPlanCard from "@/src/components/lessonPlans/LessonPlanCard";
import AddLessonPlanDialog from "@/src/components/lessonPlans/AddLessonPlanDialog";
import AddAnything from "@/src/components/AddAnything";
import { Suspense } from "react";


// LessonPlan interface
interface LessonPlan {
  id: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// LessonPlans content component to handle data fetching
async function LessonPlansContent() {
  const response = await getGenericLessonPlans();

  if (!response.success || !response.data) {
    return <div className="text-center py-8 opacity-0">No lesson plans found</div>;
  }

  // Sort the lesson plans by creation date
  const sortedLessonPlans = [...response.data].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Newest first
  });

  const getColumnColor = (index: number) => {
    switch (index % 3) {
      case 0: return "bg-purple-100";
      case 1: return "bg-pink-100";
      case 2: return "bg-indigo-100";
      default: return "bg-purple-100";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {sortedLessonPlans.map((lessonPlan, index) => (
        <LessonPlanCard
          key={lessonPlan.id}
          id={lessonPlan.id}
          name={lessonPlan.name}
          description={lessonPlan.description}
          createdAt={lessonPlan.createdAt}
          updatedAt={lessonPlan.updatedAt}
          backgroundColor={getColumnColor(index)}
        />
      ))}

      {/* Add the AddAnything component here */}
      <AddAnything 
        title="Create a Lesson Plan" 
        FormComponent={AddLessonPlanDialog} 
      />
    </div>
  );
}

// Main page component
export default function LessonPlansPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Lesson Plans</h1>
      
      <Suspense fallback={<div className="text-center py-8">Loading lesson plans...</div>}>
        <LessonPlansContent />
      </Suspense>
    </main>
  );
}