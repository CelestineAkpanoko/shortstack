import { getClasses } from "@/src/app/actions/classActions";
import DashboardAddClassCard from "@/src/components/class/dashboard-add-class-card";
import { ClassCard } from "@/src/components/class/ClassCard";
<<<<<<< Updated upstream
import { formatClassSchedule } from "@/src/lib/date-utils";
=======
import AddAnything from "@/src/components/AddAnything";
import AddClass from "@/src/components/class/AddClass";
>>>>>>> Stashed changes

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const response = await getClasses();

  if (!response.success || !response.data) {
    return <div>Failed to load classes</div>;
  }

  // Reverse the array so newest items are at the end
  const sortedClasses = [...response.data].reverse();

  return (
<<<<<<< Updated upstream
    <div className="w-full">
      {/* ✅ Improved grid with better alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
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
        {/* ✅ Add class card with consistent spacing */}
        <DashboardAddClassCard />
      </div>
=======
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
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
      <AddAnything title="Add Class" FormComponent={AddClass} />
>>>>>>> Stashed changes
    </div>
  );
}

<<<<<<< Updated upstream
=======
// Add the formatClassSchedule function for consistent display
const DaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatClassSchedule(sessions?: any[]) {
  if (!sessions || sessions.length === 0) return null;

  return sessions
    .map((session) => {
      const day = DaysOfWeek[session.dayOfWeek];
      return `${day} ${session.startTime}-${session.endTime}`;
    })
    .join(", ");
}
>>>>>>> Stashed changes
