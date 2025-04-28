"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { copyBillToClasses } from "@/src/app/actions/billActions";
import { useRouter } from "next/navigation";

interface ClassItem {
  id: string;
  name: string;
  code: string;
  emoji: string;
  studentCount?: number;
}

interface AssignBillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  billTitle: string;
  assignedClasses: Array<{ id: string; name: string; emoji?: string; code?: string }>;
}

export default function AssignBillDialog({
  isOpen,
  onClose,
  billId,
  billTitle,
  assignedClasses = []
}: AssignBillDialogProps) {
  const router = useRouter();
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the IDs of already assigned classes for filtering
  const assignedClassIds = assignedClasses.map(cls => cls.id);

  useEffect(() => {
    // Reset selected classes when dialog opens
    if (isOpen) {
      setSelectedClassIds([]);
      
      // Fetch available classes
      const fetchClasses = async () => {
        setIsLoading(true);
        try {
          const response = await fetch("/api/classes");
          if (!response.ok) {
            throw new Error("Failed to fetch classes");
          }
          const data = await response.json();
          setAllClasses(data.classes || []);
        } catch (error) {
          console.error("Error fetching classes:", error);
          toast.error("Failed to load classes");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchClasses();
    }
  }, [isOpen]);

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async () => {
    if (selectedClassIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await copyBillToClasses({
        billId,
        targetClassIds: selectedClassIds
      });

      if (result.success) {
        toast.success(result.message || "Bill assigned to classes successfully");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error || "Failed to assign bill to classes");
      }
    } catch (error) {
      console.error("Error assigning bill to classes:", error);
      toast.error("Failed to assign bill to classes");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out already assigned classes
  const availableClasses = allClasses.filter(
    cls => !assignedClassIds.includes(cls.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Bill to Classes</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Select classes to assign "{billTitle}" to:
          </p>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          ) : availableClasses.length > 0 ? (
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              {availableClasses.map(cls => (
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
                    onClick={() => handleToggleClass(cls.id)}
                  >
                    <span className="text-xl mr-2">{cls.emoji}</span>
                    <span>{cls.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {cls.studentCount} students
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              No more classes available. This bill is already assigned to all your classes.
            </p>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedClassIds.length === 0 || availableClasses.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign to Classes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}