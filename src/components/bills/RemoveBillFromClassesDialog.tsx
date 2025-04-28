"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { removeBillFromClasses } from "@/src/app/actions/billActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";

interface BillClass {
  id: string;
  name: string;
  emoji: string;
  code: string;
}

interface RemoveBillFromClassesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  billTitle: string;
  assignedClasses: BillClass[];
}

export default function RemoveBillFromClassesDialog({
  isOpen,
  onClose,
  billId,
  billTitle,
  assignedClasses,
}: RemoveBillFromClassesDialogProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isRemovingFromAll, setIsRemovingFromAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleRemoveFromAll = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await removeBillFromClasses({
        billId,
        classIds: [] // Empty array = remove from all
      });
      
      if (result.success) {
        toast.success(result.message || "Bill removed from all classes");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error || "Failed to remove bill");
      }
    } catch (error) {
      console.error("Error removing bill:", error);
      toast.error("An error occurred while removing the bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromSelected = async () => {
    if (selectedClassIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await removeBillFromClasses({
        billId,
        classIds: selectedClassIds
      });
      
      if (result.success) {
        toast.success(result.message || "Bill removed from selected classes");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error || "Failed to remove bill");
      }
    } catch (error) {
      console.error("Error removing bill:", error);
      toast.error("An error occurred while removing the bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Unassign Bill from Classes</DialogTitle>
        </DialogHeader>
        
        {isRemovingFromAll ? (
          <div className="py-4">
            <div className="flex items-center text-amber-600 mb-4 p-3 bg-amber-50 rounded-md">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>This will unassign the bill from all classes</p>
            </div>
            
            <p className="text-gray-700 mb-4">
              Are you sure you want to unassign "{billTitle}" from all classes? The bill will still be available in your account.
            </p>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRemovingFromAll(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveFromAll}
                disabled={isSubmitting}
                variant="destructive"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unassigning...
                  </>
                ) : (
                  "Unassign from All"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Select classes to unassign "{billTitle}" from:
            </p>
            
            {assignedClasses.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border rounded p-2">
                {assignedClasses.map(cls => (
                  <div
                    key={cls.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer mb-1 ${
                      selectedClassIds.includes(cls.id) ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={selectedClassIds.includes(cls.id)}
                      onCheckedChange={() => handleToggleClass(cls.id)}
                    />
                    <Label
                      htmlFor={`class-${cls.id}`}
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <span className="mr-2">{cls.emoji}</span>
                      <span>{cls.name}</span>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">
                This bill is not assigned to any classes
              </p>
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRemovingFromAll(true)}
                disabled={isSubmitting || assignedClasses.length === 0}
              >
                Unassign from All Classes
              </Button>
              
              <Button
                onClick={handleRemoveFromSelected}
                disabled={isSubmitting || selectedClassIds.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unassigning...
                  </>
                ) : (
                  "Unassign Selected"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}