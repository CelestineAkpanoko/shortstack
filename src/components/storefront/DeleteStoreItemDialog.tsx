"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { deleteStoreItem } from "@/src/app/actions/storeFrontActions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteStoreItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storeItemId: string;
  storeItemName: string;
}
export default function DeleteStoreItemDialog({
  isOpen,
  onClose,
  storeItemId,
  storeItemName,
}: DeleteStoreItemDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteStoreItem(storeItemId);

      if (result.success) {
        toast.success("Store item deleted successfully");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error || "Failed to delete store item");
      }
    } catch (error) {
      console.error("Error deleting store item:", error);
      toast.error("An error occurred while deleting the store item");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isDeleting && !open && onClose()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Store Item</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center text-amber-600 mb-4 p-3 bg-amber-50 rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>This action cannot be undone</p>
          </div>

          <p className="text-gray-700">
            Are you sure you want to delete the store item "{storeItemName}"?
            This will remove the item from all classes.
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
            className="min-w-[100px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Store Item"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
