'use client'

import { useState } from "react";
import { Card } from "../ui/card";
import { formatCurrency } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { Copy, MoreHorizontal, Trash, Pen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import AssignBillDialog from "./AssignBillDialog";
import DeleteBillDialog from "./DeleteBillDialog";
import EditBillForm from "./EditBillForm";
import Link from "next/link";

interface BillCardProps {
  id: string;
  emoji: string;
  title: string;
  amount: number;
  dueDate: Date;
  frequency: string;
  status: string;
  description?: string;
  backgroundColor: string;
  classes: Array<{ id: string; name: string; emoji?: string; code?: string }>;
}

export const BillCard = ({
  id,
  title,
  emoji,
  amount,
  dueDate,
  frequency,
  status,
  description,
  backgroundColor,
  classes = [],
}: BillCardProps) => {
  const router = useRouter();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Format the due date
  const formattedDueDate = new Date(dueDate).toLocaleDateString();

  // Format the frequency for display
  const getFrequencyDisplay = (freq: string) => {
    switch (freq) {
      case "ONCE": return "One Time";
      case "WEEKLY": return "Weekly";
      case "BIWEEKLY": return "Bi-weekly";
      case "MONTHLY": return "Monthly";
      case "QUARTERLY": return "Quarterly";
      case "YEARLY": return "Yearly";
      default: return freq;
    }
  };

  const navigateToBill = () => {
    router.push(`/teacher/dashboard/bills/${id}`);
  };

  return (
    <>
      <Card
        className={`overflow-hidden w-[250px] h-[250px] relative cursor-pointer hover:shadow-md transition-shadow ${backgroundColor}`}
        onClick={navigateToBill}
      >
        <div className="absolute right-2 top-2 z-10" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full hover:bg-black/10">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowAssignDialog(true)}>
                <Copy className="mr-2 h-4 w-4" />
                Assign to More Classes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Pen className="mr-2 h-4 w-4" />
                Update Bill
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Bill
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-5">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">{emoji}</div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Due:</span> {formattedDueDate}</p>
            <p><span className="font-medium">Frequency:</span> {getFrequencyDisplay(frequency)}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {classes && classes.length > 0 ? (
                classes.slice(0, 3).map((cls: any) => (
                  <span key={cls.id} className="inline-flex items-center text-xs bg-white rounded-full px-2 py-1 border">
                    <span className="mr-1">{cls.emoji}</span>
                    <span className="truncate max-w-[80px]">{cls.name}</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center text-xs bg-white rounded-full px-2 py-1 border text-gray-500">
                  <span className="mr-1">📝</span>
                  <span>Unassigned</span>
                </span>
              )}

              {classes && classes.length > 3 && (
                <span className="inline-flex items-center text-xs bg-white rounded-full px-2 py-1 border">
                  +{classes.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <AssignBillDialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        billId={id}
        billTitle={title}
        assignedClasses={classes}
      />

      <EditBillForm
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        billData={{
          id,
          title,
          amount,
          dueDate,
          frequency,
          status,
          description: description || '',
          class: classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            emoji: cls.emoji || "📝", // Provide a default emoji if none exists
            code: cls.code || "" // Ensure code is always a string
          }))
        }}
      />

      <DeleteBillDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        billId={id}
        billTitle={title}
      />
    </>
  );
};