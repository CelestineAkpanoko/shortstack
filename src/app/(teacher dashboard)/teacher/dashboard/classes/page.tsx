import { getClasses } from "@/src/app/actions/classActions";
import DashboardAddClassCard from "@/src/components/class/dashboard-add-class-card";
import { ClassCard } from "@/src/components/class/ClassCard";
import { formatClassSchedule } from "@/src/lib/date-utils";

export const dynamic = 'force-dynamic';

export default async function ClassesPage() {
  const response = await getClasses();

  if (!response.success || !response.data) {
    return <div>Failed to load classes</div>;
  }

  // Reverse the array so newest items are at the end
  const sortedClasses = [...response.data].reverse();

  return (
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
    </div>
  );
}

