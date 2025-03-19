import DashboardAddStoreItemCard from "@/src/components/storefront/dashboardAddStoreItemCard";
import { getStoreItems } from "@/src/app/actions/storeFrontActions";
import { StoreItemCard } from "@/src/components/storefront/StoreItemCard";
import { Store } from "lucide-react";

export default async function StoreFrontPage() {
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
  const response = await getStoreItems();
  if (!response.success || !response.data) {
    return <div>Failed to load classes</div>;
  }

    // Reverse the array so newest items are at the end
    const sortedStoreItems = [...response.data].reverse();

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
      <DashboardAddStoreItemCard />
        </div>
        </div>
    </main>
  );
}
