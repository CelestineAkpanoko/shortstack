"use client"

import { useState, useEffect, useRef } from "react";
import { createBill } from "@/src/app/actions/billActions";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { EmojiPickerButton } from "@/src/components/ui/emoji-picker-button";

type AddBillProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
};

// Class interface
interface ClassItem {
  id: string;
  name: string;
  code: string;
  emoji: string;
  studentCount: number;
}

const AddBill = ({ isOpen = false, onClose, onSuccess }: AddBillProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("💰");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for classes
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  useEffect(() => {
    // Only fetch classes when dialog is open
    if (isOpen) {
      const fetchClasses = async () => {
        setIsLoadingClasses(true);
        try {
          const response = await fetch("/api/classes");
          if (response.ok) {
            const data = await response.json();
            setClasses(data.classes || []);
          } else {
            toast.error("Failed to fetch classes");
          }
        } catch (error) {
          console.error("Error fetching classes:", error);
        } finally {
          setIsLoadingClasses(false);
        }
      };

      fetchClasses();
    }
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmoji("💰");
      setSelectedClassIds([]);
      formRef.current?.reset();
    }
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
    setEmojiPickerOpen(false); // Close the emoji picker when an emoji is selected
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleDialogChange = (open: boolean) => {
    if (!open && !isSubmitting && onClose) {
      onClose();
    }
  };

  const clientAction = async (formData: FormData) => {
    try {
      // Validate that at least one class is selected
      if (selectedClassIds.length === 0) {
        toast.error("Please select at least one class");
        return;
      }
      
      setIsSubmitting(true);
      
      // Add selected class IDs to the form data
      selectedClassIds.forEach(classId => {
        formData.append("classIds", classId);
      });
      
      const result = await createBill(formData);

      if (!result.success) {
        toast.error(result.error || "Failed to create bill");
      } else {
        toast.success("Bill created successfully!");
        formRef.current?.reset();
        setSelectedEmoji("💰");
        setSelectedClassIds([]);
        
        // Force a router refresh
        router.refresh();
        
        // Close dialog and trigger success callback
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (error) {
      toast.error("Failed to create bill");
      console.error("Create bill error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
        </DialogHeader>
        
        <form ref={formRef} action={clientAction} className="space-y-4">
          <div className="flex items-center gap-3">
            <EmojiPickerButton 
              value={selectedEmoji}
              onChange={(emoji) => {
                setSelectedEmoji(emoji);
                setEmojiPickerOpen(false);
              }}
              className="text-2xl h-14 w-14"
            />
            
            <Input
              name="title"
              placeholder="Bill title"
              className="flex-1"
              required
              disabled={isSubmitting}
            />
            
            <input type="hidden" name="emoji" value={selectedEmoji} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              name="frequency"
              className="w-full p-2 border rounded"
              required
              disabled={isSubmitting}
            >
              <option value="ONCE">One Time</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              name="description"
              className="w-full p-2 border rounded"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Class selection section - FIXED to match RemoveBillFromClassesDialog */}
          <div>
            <Label className="mb-2 block">Select Classes</Label>
            {isLoadingClasses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-2 text-gray-500">
                No classes available. Create a class first.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded p-2">
                {classes.map(cls => (
                  <div
                    key={cls.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer mb-1 ${
                      selectedClassIds.includes(cls.id) ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={selectedClassIds.includes(cls.id)}
                      onCheckedChange={() => toggleClassSelection(cls.id)}
                    />
                    <Label
                      htmlFor={`class-${cls.id}`}
                      className="flex items-center cursor-pointer flex-1"
                      onClick={() => toggleClassSelection(cls.id)}
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
            )}
            {selectedClassIds.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Please select at least one class
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedClassIds.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBill;