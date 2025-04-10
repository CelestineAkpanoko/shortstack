"use client";

import { useState } from "react";
import { Card } from "@/src/components/ui/card";
import { formatCurrency } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { EditStoreItemForm } from "./EditStoreItemForm";
import { deleteStoreItem } from "@/src/app/actions/storeFrontActions";
import { toast } from "react-toastify";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import DeleteStoreItemDialog from "./DeleteStoreItemDialog";


interface StoreItemCardProps {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description?: string;
  quantity: number;
  isAvailable: boolean;
  backgroundColor: string;
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
}: StoreItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card className="bg-transparent w-[250px] h-[250px] rounded-xl relative">
        <div className="absolute top-2 right-2 hidden group-hover:flex gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="w-8 h-8"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div
          className={`${backgroundColor} w-full h-full rounded-xl flex flex-col p-4`}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-3xl">{emoji}</span>
            <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-white/20"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Store Item
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
          </div>

          <div className="flex flex-col flex-grow">
            <h3 className="text-2xl font-semibold mb-1">{name}</h3>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">{formatCurrency(price)}</span>
              <span className="text-sm text-gray-600">{quantity} left</span>
            </div>
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
      <DeleteStoreItemDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        storeItemId={id}
        storeItemName={name}
    />
    </>
  );
}
