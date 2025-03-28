"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { copyBillToClasses } from "@/src/app/actions/billActions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  code: string;
  emoji: string;
  isAssigned?: boolean;
}

interface BillClass {
  id: string;
  name: string;
}

interface AssignBillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  billTitle: string;
  assignedClasses: BillClass[];
}

export default function AssignBillDialog({
  isOpen,
  onClose,
  billId,
  billTitle,
  assignedClasses,
}: AssignBillDialogProps) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Get the IDs of classes this bill is already assigned to
  const assignedClassIds = assignedClasses.map(c => c.id);
  
  // Add this ref to track whether we've already fetched classes
  const hasFetchedRef = useRef(false);

  // Fetch available classes when the dialog opens
  useEffect(() => {
    const fetchClasses = async () => {
      // Only fetch if the dialog is open and we haven't already fetched
      if (!isOpen || hasFetchedRef.current) return;
      
      setIsLoading(true);
      try {
        // Mark that we've started fetching
        hasFetchedRef.current = true;
        
        const response = await fetch("/api/classes");
        if (response.ok) {
          const data = await response.json();
          
          // Mark classes that already have this bill
          const processedClasses = data.classes.map((cls: ClassItem) => ({
            ...cls,
            isAssigned: assignedClassIds.includes(cls.id)
          }));
          
          setClasses(processedClasses);
        } else {
          toast.error("Failed to load classes");
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Could not load classes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
    
    // Reset the fetch flag when dialog closes
    return () => {
      if (!isOpen) {
        hasFetchedRef.current = false;
        setSelectedClassIds([]);
      }
    };
  }, [isOpen]); // Only depend on isOpen, not assignedClassIds

  const toggleClassSelection = (classId: string) => {
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
        toast.success(result.message || "Bill assigned to additional classes");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error || "Failed to assign bill to classes");
      }
    } catch (error) {
      console.error("Error assigning bill:", error);
      toast.error("An error occurred while assigning bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onClose();
          // Reset the fetch flag when dialog closes via UI
          hasFetchedRef.current = false;
          setSelectedClassIds([]);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Bill to Additional Classes</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-gray-600 mb-4">
            Assign "{billTitle}" to additional classes. The bill will appear in both the original and the newly selected classes.
          </p>

          <div>
            <Label className="mb-2 block">Select Classes</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                You don't have any classes yet.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border rounded p-2">
                {classes.map(cls => (
                  <div 
                    key={cls.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer mb-1 ${
                      cls.isAssigned 
                        ? "bg-gray-100 text-gray-500" 
                        : selectedClassIds.includes(cls.id)
                          ? "bg-blue-100"
                          : "hover:bg-gray-50"
                    }`}
                    onClick={() => !cls.isAssigned && toggleClassSelection(cls.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id) || cls.isAssigned}
                      disabled={cls.isAssigned}
                      onChange={() => !cls.isAssigned && toggleClassSelection(cls.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-xl mr-1">{cls.emoji}</span>
                    <span>{cls.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {cls.code}
                    </span>
                    {cls.isAssigned && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        Already assigned
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!isLoading && classes.length > 0 && selectedClassIds.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Please select at least one class
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                onClose();
                // Reset fetch flag on manual close
                hasFetchedRef.current = false;
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || selectedClassIds.length === 0}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Bill"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}