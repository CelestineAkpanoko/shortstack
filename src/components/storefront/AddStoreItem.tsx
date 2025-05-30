"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";

import { createStoreItem } from "@/src/app/actions/storeFrontActions";

type AddStoreItemProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
};

// Add Class interface
interface ClassItem {
  id: string;
  name: string;
  code: string;
  emoji: string;
  studentCount: number;
}

const AddStoreItem = ({ isOpen, onClose, onSuccess }: AddStoreItemProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("🛍️");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for classes
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // State for availability
  const [isAvailableChecked, setIsAvailableChecked] = useState(true);

  // Fetch classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoadingClasses(true);
        const response = await fetch("/api/classes");

        if (response.ok) {
          const data = await response.json();
          setClasses(data.classes || []);
        } else {
          console.error("Failed to fetch classes");
          toast.error("Couldn't load your classes");
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
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
      selectedClassIds.forEach((classId) => {
        formData.append("classIds", classId);
      });

      // Handle isAvailable explicitly
      const isAvailableValue = formData.get("isAvailable");
      // If the last value is "true" (from the checked switch), use that
      const isAvailable = isAvailableValue === "true";

      // Replace with the correctly processed boolean value
      formData.delete("isAvailable");
      formData.append("isAvailable", isAvailable ? "true" : "false");

      const result = await createStoreItem(formData);

      if (!result.success) {
        toast.error(result.error || "Failed to create store item");
      } else {
        toast.success("Store item created successfully!");
        formRef.current?.reset();
        setSelectedEmoji("🛍️"); // Reset emoji
        setSelectedClassIds([]);

        // Force a router refresh
        router.refresh();

        // Close dialog and trigger success callback
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (error) {
      toast.error("Failed to create store item");
      console.error("Create store item error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isSubmitting && !open && onClose?.()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Store Item</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={clientAction} className="space-y-4">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-2xl h-14 w-14">
                  {selectedEmoji}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </PopoverContent>
            </Popover>

            <Input
              name="name"
              placeholder="Item name"
              className="flex-1"
              required
              disabled={isSubmitting}
            />

            <input type="hidden" name="emoji" value={selectedEmoji} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Available</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                defaultValue="1"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isAvailable">Available for Purchase</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={isAvailableChecked}
                  onCheckedChange={setIsAvailableChecked}
                />
                <Label htmlFor="isAvailable">Available</Label>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Item Description"
                className="min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Class selection section */}
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
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 mb-1 ${
                      selectedClassIds.includes(cls.id) ? "bg-blue-100" : ""
                    }`}
                    onClick={() => toggleClassSelection(cls.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => toggleClassSelection(cls.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-xl mr-1">{cls.emoji}</span>
                    <span>{cls.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {cls.studentCount} students
                    </span>
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
              variant="outline"
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
              ) : (
                "Create Item"
              )}
            </Button>
          </div>

          {/* Hidden input for isAvailable */}
          <input
            type="hidden"
            name="isAvailable"
            value={isAvailableChecked ? "true" : "false"}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStoreItem;
