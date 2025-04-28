// import DashboardAddStoreItemCard from "@/src/components/storefront/dashboardAddStoreItemCard";
import { getAllStoreItems } from "@/src/app/actions/storeFrontActions";
import { StoreItemCard } from "@/src/components/storefront/StoreItemCard";
import AddAnything from "@/src/components/AddAnything";
import AddStoreItem from "@/src/components/storefront/AddStoreItem";
import { getAuthSession } from "@/src/lib/auth";
import { db } from "@/src/lib/db"; // Import the db instance properly

interface ItemClass {
  id: string;
  name: string;
}

// StoreItems content component to handle data fetching
async function StoreItemsContent() {
  const getColumnColor = (index: number) => {
    switch (index % 3) {
      case 0:
        return "bg-green-200";
      case 1:
        return "bg-emerald-200";
      case 2:
        return "bg-teal-200";
      default:
        return "bg-blue-200";
    }
  };
  
  // Get the current teacher's class ID
  const session = await getAuthSession();
  const teacherId = session?.user?.id;
  
  // Fetch the primary class ID for this teacher
  // Use the imported db instance instead of prisma directly
  const teacherClass = await db.class.findFirst({
    where: { userId: teacherId },
    select: { id: true }
  });
  
  const classId = teacherClass?.id;
  
  if (!classId) {
    return <div>No class found for this teacher</div>;
  }
  
  const response = await getStoreItems(classId);
  if (!response.success || !response.data) {
    return <div>Failed to load storeItems</div>;
  }

  // Reverse the array so newest items are at the end
  const sortedStoreItems = [...response.data].reverse();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedStoreItems.map((storeItem, index) => (
        <StoreItemCard
          key={storeItem.id}
          {...storeItem}
          backgroundColor={getColumnColor(index)}
        />
      ))}
      {/* <DashboardAddStoreItemCard /> */}
      <AddAnything title="Add Store Item" FormComponent={AddStoreItem} />
    </div>
  );
}

export default async function StoreFrontPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Storefront</h1>
      <div className="max-w-4xl ml-0 mr-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStoreItems.map((storeItem, index) => (
            <StoreItemCard
              key={storeItem.id}
              {...storeItem}
              backgroundColor={getColumnColor(index)}
            />
          ))}
          <AddAnything
            title="Add Store Item"
            FormComponent={AddStoreItem}
            onItemAdded={(newItem) => {
              // Handle new item addition if needed
            }}
          />
        </div>
      </div>
    </main>
  );
}
