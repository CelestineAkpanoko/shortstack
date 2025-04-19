"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/components/ui/card";
import { formatCurrency } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { EditStoreItemForm } from "./EditStoreItemForm";
import { deleteStoreItem } from "@/src/app/actions/storeFrontActions";
import { toast } from "react-toastify";
import {
  Copy,
  Pencil,
  Trash2,
  MoreVertical,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import DeleteStoreItemDialog from "./DeleteStoreItemDialog";
import AssignStoreItemDialog from "./AssignStoreItemDialog";

interface StoreItemCardProps {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description?: string;
  quantity: number;
  isAvailable: boolean;
  backgroundColor: string;
  classes?: Array<{ id: string; name: string }>;
}

export function StoreItemCard({
  id,
  name,
  emoji,
  price,
  description,
  quantity,
  isAvailable,
  backgroundColor,
  classes = [],
}: StoreItemCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const navigateToStoreItem = () => {
    router.push(`/dashboard/storefront/${id}`);
  };

  return (
    <>
      <Card
        className={`overflow-hidden w-[250px] h-[250px] relative cursor-pointer hover:shadow-md transition-shadow ${backgroundColor}`}
        onClick={navigateToStoreItem}
      >
        <div
          className="absolute right-2 top-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/20">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Store Item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAssignDialog(true)}>
                <Copy className="mr-2 h-4 w-4" />
                Assign to More Classes
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Store Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-5">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">{emoji}</div>
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-2xl font-bold">{formatCurrency(price)}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
          <p><span className="font-medium">Quantity:</span> {quantity}</p>

          {classes.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-1">Assigned to:</p>
                <div className="flex flex-wrap gap-1">
                  {classes.slice(0, 2).map(cls => (
                    <span key={cls.id} className="bg-white/50 px-2 py-0.5 rounded text-xs">
                      {cls.name}
                    </span>
                  ))}
                  {classes.length > 2 && (
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs">
                      +{classes.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <EditStoreItemForm
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        itemData={{
          id,
          name,
          emoji,
          price,
          description,
          quantity,
          isAvailable,
        }}
      />
      <AssignStoreItemDialog
        isOpen={showAssignDialog}
        onClose={() => setIsEditing(false)}
        assignedClasses={classes}
        storeItemId={id}
        storeItemTitle={name}
      />

      <DeleteStoreItemDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        storeItemId={id}
        storeItemName={name}
      />
    </>
  );
}
