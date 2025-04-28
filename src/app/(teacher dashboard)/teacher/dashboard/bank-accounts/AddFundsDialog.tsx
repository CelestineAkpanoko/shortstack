"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "sonner";
import { formatCurrency } from "@/src/lib/utils";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  checking: { id: string; balance: number };
  savings: { id: string; balance: number };
}

interface AddFundsDialogProps {
  open: boolean;
  onClose: () => void;
  selectedStudents: Student[];
  onComplete: () => void;
}

export default function AddFundsDialog({ 
  open, 
  onClose, 
  selectedStudents, 
  onComplete 
}: AddFundsDialogProps) {
  const [amount, setAmount] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setAmount("");
    setAccountType("checking");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid amount greater than zero."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/teacher/banking/add-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudents.map(s => s.id),
          accountType,
          amount: parseFloat(amount),
          description: description || `Funds added by teacher`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add funds");
      }

      toast.success("Funds added successfully", {
        description: `Added ${formatCurrency(parseFloat(amount))} to ${selectedStudents.length} student(s).`
      });
      
      handleClose();
      onComplete();
    } catch (error) {
      console.error("Error adding funds:", error);
      toast.error("Error adding funds", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>
            Add funds to {selectedStudents.length} selected student{selectedStudents.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter a description for this transaction"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>
            <RadioGroup value={accountType} onValueChange={setAccountType} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="checking" id="checking" />
                <Label htmlFor="checking">Checking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="savings" id="savings" />
                <Label htmlFor="savings">Savings</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mt-4">
              This will add {formatCurrency(parseFloat(amount) || 0)} to the {accountType} account of each selected student.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Add Funds"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}