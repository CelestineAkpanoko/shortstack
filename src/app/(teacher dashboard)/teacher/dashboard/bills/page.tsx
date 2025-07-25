import { getBills } from "@/src/app/actions/billActions";
import { BillCard } from "@/src/components/bills/BillCard";
import { Suspense } from "react";
import AddAnything from "@/src/components/AddAnything";
import AddBill from "@/src/components/bills/AddBill";

export const dynamic = 'force-dynamic';

// Main page component
export default function BillsPage() {
  return (
    <div className="w-full h-full bg-gray-50"> {/* Add consistent background */}
      <Suspense fallback={
        <div className="flex justify-center items-center h-full bg-gray-50">
          <div className="w-20 h-20 border-4 border-green-100 border-t-green-500 rounded-full animate-spin"></div>
        </div>
      }>
        <BillsContent />
      </Suspense>
    </div>
  );
}

// Bills content component to handle data fetching
async function BillsContent() {
  const response = await getBills({ includeUnassigned: true });

  if (!response.success || !response.data) {
    return <div className="text-center py-8 bg-gray-50 h-full">No bills found</div>;
  }

  const sortedBills = [...response.data].sort((a, b) => {
    if (a.frequency !== "ONCE" && b.frequency === "ONCE") return -1;
    if (a.frequency === "ONCE" && b.frequency !== "ONCE") return 1;

    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return dateA - dateB;
  });

  const getColumnColor = (index: number) => {
    switch (index % 3) {
      case 0: return "bg-blue-200";
      case 1: return "bg-green-200";
      case 2: return "bg-yellow-200";
      default: return "bg-blue-200";
    }
  };

  return (
    <div className="min-h-full bg-gray-50"> {/* Ensure full height background */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 p-4 sm:p-6 bg-gray-50">
        {sortedBills.map((bill, index) => (
          <BillCard
            key={bill.id}
            id={bill.id}
            title={bill.title}
            emoji={bill.emoji}
            amount={bill.amount}
            dueDate={bill.dueDate}
            frequency={bill.frequency}
            status={bill.status}
            description={bill.description || ""}
            backgroundColor={getColumnColor(index)}
            classes={bill.class}
          />
        ))}
        
        <AddAnything 
          title="Create a Bill" 
          FormComponent={AddBill} 
        />
      </div>
    </div>
  );
}