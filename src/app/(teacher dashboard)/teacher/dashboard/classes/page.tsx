import { getClasses } from "@/src/app/actions/classActions";
import DashboardAddClassCard from "@/src/components/class/dashboard-add-class-card";
import { ClassCard } from "@/src/components/class/ClassCard";

export default async function ClassesPage() {


  const response = await getClasses();

  if (!response.success || !response.data) {
    return <div>Failed to load classes</div>;
  }

    // Reverse the array so newest items are at the end
    const sortedClasses = [...response.data].reverse();


  return (
    <main className="mx-auto p-4">
      <div className="max-w-4xl ml-0 mr-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedClasses.map((cls) => {
            // Ensure proper data transformation for consistent display
            return (
              <ClassCard
                key={cls.id}
                id={cls.id}
                emoji={cls.emoji}
                name={cls.name}
                code={cls.code}
                color={cls.color || "primary"}
                grade={cls.grade}
                numberOfStudents={cls._count?.enrollments || 0}
                schedule={formatClassSchedule(cls.classSessions)}
                overview={cls.overview}
              />
            );
          })}
          <DashboardAddClassCard />
        </div>
      </div>
    </main>
  );
}

// Add the formatClassSchedule function for consistent display
const DaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatClassSchedule(sessions?: any[]) {
  if (!sessions || sessions.length === 0) return null;
  
  return sessions.map(session => {
    const day = DaysOfWeek[session.dayOfWeek];
    return `${day} ${session.startTime}-${session.endTime}`;
  }).join(', ');
}