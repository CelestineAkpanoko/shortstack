"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { EmojiPickerButton } from "@/src/components/ui/emoji-picker-button";
import { updateBill } from "@/src/app/actions/billActions";

interface BillClass {
  id: string;
  name: string;
  emoji: string;
  code: string;
}

interface EditBillFormProps {
  isOpen: boolean;
  onClose: () => void;
  billData: {
    id: string;
    title: string;
    emoji?: string;
    amount: number;
    dueDate: Date;
    frequency: string;
    status: string;
    description?: string;
    class?: BillClass[];
  };
}

const frequencyOptions = [
  { value: "ONCE", label: "One Time" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EditBillForm({
  isOpen,
  onClose,
  billData
}: EditBillFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [title, setTitle] = useState(billData.title);
  const [emoji, setEmoji] = useState(billData.emoji || "💰");
  const [amount, setAmount] = useState(billData.amount?.toString() || "0");
  const [dueDate, setDueDate] = useState(formatDate(billData.dueDate));
  const [frequency, setFrequency] = useState(billData.frequency);
  const [description, setDescription] = useState(billData.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !amount || !dueDate || !frequency) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await updateBill(billData.id, {
        title,
        emoji,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        frequency: frequency as any,
        description
      });
      
      if (result.success) {
        toast.success("Bill updated successfully");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error || "Failed to update bill");
      }
    } catch (error) {
      console.error("Error updating bill:", error);
      toast.error("An error occurred while updating the bill");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !isSubmitting && !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bill</DialogTitle>
        </DialogHeader>
        
          
            <form onSubmit={handleSubmit} ref={formRef} className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <EmojiPickerButton 
                  value={emoji}
                  onChange={setEmoji}
                />
                
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Bill title"
                  className="flex-1"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
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
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
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
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                  disabled={isSubmitting}
                >
                  {frequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                  disabled={isSubmitting}
                />
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Bill"
                  )}
                </Button>
              </div>
            </form>
      </DialogContent>
    </Dialog>
  );
}