import { getClasses } from "@/src/app/actions/classActions";
import DashboardAddClassCard from "@/src/components/class/dashboard-add-class-card";
import { ClassCard } from "@/src/components/class/ClassCard";

export default async function ClassesPage() {
  const getColumnColor = (index: number) => {
    switch (index % 3) {
      case 0:
        return "bg-green-500";
      case 1:
        return "bg-orange-500";
      case 2:
        return "bg-pink-500";
      default:
        return "bg-blue-500";
    }
  };

  const response = await getClasses();

  if (!response.success || !response.data) {
    return <div>Failed to load classes</div>;
  }

    // Reverse the array so newest items are at the end
    const sortedClasses = [...response.data].reverse();


  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Classes</h1>
      <div className="max-w-4xl ml-0 mr-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedClasses.map((cls, index) => (
            <ClassCard
              key={cls.id}
              {...cls}
            backgroundColor={getColumnColor(index)}
            />
          ))}
          <DashboardAddClassCard />
        </div>
      </div>
    </main>
  );
}