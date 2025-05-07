// import DashboardAddStoreItemCard from "@/src/components/storefront/dashboardAddStoreItemCard";
import { getAllStoreItems } from "@/src/app/actions/storeFrontActions";
import { StoreItemCard } from "@/src/components/storefront/StoreItemCard";
import AddAnything from "@/src/components/AddAnything";
import AddStoreItem from "@/src/components/storefront/AddStoreItem";
import { Suspense } from "react";

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
  const response = await getAllStoreItems();
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
      <Suspense
        fallback={
          <div className="text-center py-8">Loading store items...</div>
        }
      >
        <StoreItemsContent />
      </Suspense>
    </main>
  );
}