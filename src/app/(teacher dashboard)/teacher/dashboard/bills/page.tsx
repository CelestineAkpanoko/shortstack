import { getBills } from "@/src/app/actions/billActions";
import { BillCard } from "@/src/components/bills/BillCard";
import { Suspense } from "react";
import AddAnything from "@/src/components/AddAnything";
import AddBill from "@/src/components/bills/AddBill";

interface BillClass {
  id: string;
  name: string;
  emoji?: string;
  code?: string;
}

// Bills content component to handle data fetching
async function BillsContent() {
  // Get bills with includeUnassigned=true to get all bills created by the user
  const response = await getBills({ includeUnassigned: true });

  if (!response.success || !response.data) {
    return <div className="text-center py-8 opacity-0">No bills found</div>;
  }

  // Sort the bills
  const sortedBills = [...response.data].sort((a, b) => {
    // First compare by frequency
    if (a.frequency !== "ONCE" && b.frequency === "ONCE") return -1;
    if (a.frequency === "ONCE" && b.frequency !== "ONCE") return 1;

    // If frequencies are the same, sort by due date
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return dateA - dateB;
  });

  const getColumnColor = (index: number) => {
    switch (index % 3) {
      case 0: return "bg-blue-100";
      case 1: return "bg-green-100";
      case 2: return "bg-yellow-100";
      default: return "bg-blue-100";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
          classes={bill.class} // Use class instead of classes
        />
      ))}
      
      <AddAnything 
        title="Create a Bill" 
        FormComponent={AddBill} 
      />
    </div>
  );
}

// Main page component
export default function BillsPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Bills</h1>
      
      <Suspense fallback={<div className="text-center py-8">Loading bills...</div>}>
        <BillsContent />
      </Suspense>
    </main>
  );
}