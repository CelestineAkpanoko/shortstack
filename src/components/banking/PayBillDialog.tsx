'use client'

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { formatCurrency } from "@/src/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { Label } from "@/src/components/ui/label"
import { Input } from "@/src/components/ui/input"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"

interface Bill {
  id: string
  title: string
  amount: number
  dueDate: Date
  description?: string
  paidAmount?: number
  billId: string
  studentId: string
  classId: string
  className: string
  emoji: string
}

interface PayBillDialogProps {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
  onPaymentComplete?: () => void
}

type PaymentMode = "full" | "partial" | "custom"

export default function PayBillDialog({
  isOpen,
  onClose,
  accounts = [],
  onPaymentComplete
}: PayBillDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("full")
  const [customAmount, setCustomAmount] = useState("")
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment'>('select')
  
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId)
  
  // Reset dialog state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedAccountId("")
      setIsSubmitting(false)
      setSelectedBill(null)
      setPaymentMode("full")
      setCustomAmount("")
      setPaymentStep('select')
      setError(null)
      
      // Set default account if available
      if (accounts?.length > 0) {
        // Default to checking account if available
        const checkingAccount = accounts.find(acc => acc.accountType === "CHECKING")
        if (checkingAccount) {
          setSelectedAccountId(checkingAccount.id)
        } else if (accounts[0]) {
          setSelectedAccountId(accounts[0].id)
        }
      }
      
      fetchBills()
    }
  }, [isOpen, accounts])
  
  const fetchBills = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/student/bills')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch bills")
      }
      
      const data = await response.json()
      setBills(data)
    } catch (error) {
      console.error("Error fetching bills:", error)
      setError(typeof error === 'object' && error !== null ? (error as Error).message : "Failed to fetch bills")
    } finally {
      setIsLoading(false)
    }
  }
  
  const getRemainingAmount = () => {
    if (!selectedBill) return 0
    
    const totalAmount = selectedBill.amount
    const paidAmount = selectedBill.paidAmount || 0
    return totalAmount - paidAmount
  }
  
  const getPaymentAmount = () => {
    const remainingAmount = getRemainingAmount()
    
    switch (paymentMode) {
      case "full":
        return remainingAmount
      case "partial":
        return remainingAmount / 2 // Pay half
      case "custom":
        return parseFloat(customAmount) || 0
      default:
        return remainingAmount
    }
  }
  
  const handleSelectBill = (bill: Bill) => {
    setSelectedBill(bill)
    setPaymentStep('payment')
    setPaymentMode("full")
    setCustomAmount("")
  }
  
  const handlePayBill = async () => {
    if (!selectedAccountId || !selectedBill) {
      toast.error("Please select an account and a bill to pay");
      return;
    }
    
    const paymentAmount = getPaymentAmount();
    
    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    
    if (!selectedAccount) {
      toast.error("Selected account not found");
      return;
    }
    
    const remainingBillAmount = getRemainingAmount();
    
    if (paymentAmount > remainingBillAmount) {
      toast.error(`Payment cannot exceed the remaining bill amount of ${formatCurrency(remainingBillAmount)}`);
      return;
    }
    
    if (selectedAccount.balance < paymentAmount) {
      toast.error(`Insufficient funds in your ${selectedAccount.accountType === "CHECKING" ? "checking" : "savings"} account. Available balance: ${formatCurrency(selectedAccount.balance)}`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/student/banking/paybill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          billId: selectedBill.billId,
          accountId: selectedAccountId,
          amount: paymentAmount
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process payment")
      }
      
      toast.success("Bill payment successful!");
      onClose();
      
      // Make sure we complete all state updates before refreshing
      setTimeout(() => {
        if (onPaymentComplete) onPaymentComplete();
      }, 100);
      
    } catch (error) {
      console.error("Payment error:", error)
      toast.error(typeof error === 'object' && error !== null ? (error as Error).message : "Failed to process payment")
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleBackToSelection = () => {
    setPaymentStep('select')
    setSelectedBill(null)
  }
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pay Bills</DialogTitle>
          <DialogDescription>
            Pay your outstanding bills using your bank accounts.
            You can only pay one bill at a time.
          </DialogDescription>
        </DialogHeader>
        
        {paymentStep === 'select' ? (
          <div className="space-y-4 py-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can only pay one bill at a time
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Unpaid Bills</h3>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : bills.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No unpaid bills found</p>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill) => {
                    const remainingAmount = bill.amount - (bill.paidAmount || 0);
                    return (
                      <div 
                        key={bill.id} 
                        className="flex justify-between items-center p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectBill(bill)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{bill.emoji}</span>
                            <span className="font-medium">{bill.title}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {bill.className} • Due: {formatDate(bill.dueDate)}
                          </p>
                          {bill.paidAmount && bill.paidAmount > 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              Partially paid: {formatCurrency(bill.paidAmount)} of {formatCurrency(bill.amount)}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-right">
                            {formatCurrency(remainingAmount)}
                          </p>
                          <p className="text-xs text-gray-500">remaining</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-3">
            {selectedBill && (
              <>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{selectedBill.emoji}</span>
                    <h3 className="font-medium">{selectedBill.title}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Class:</p>
                      <p>{selectedBill.className}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due date:</p>
                      <p>{formatDate(selectedBill.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total amount:</p>
                      <p>{formatCurrency(selectedBill.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Remaining:</p>
                      <p className="font-medium">{formatCurrency(getRemainingAmount())}</p>
                    </div>
                  </div>
                  
                  {selectedBill.description && (
                    <div className="mt-2">
                      <p className="text-gray-500 text-sm">Description:</p>
                      <p className="text-sm">{selectedBill.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Pay from account</Label>
                  <Select 
                    value={selectedAccountId} 
                    onValueChange={setSelectedAccountId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountType === "CHECKING" ? "Checking" : "Savings"} ({formatCurrency(account.balance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label>Payment amount</Label>
                  <RadioGroup 
                    value={paymentMode} 
                    onValueChange={(value) => setPaymentMode(value as PaymentMode)}
                    className="space-y-2"
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="cursor-pointer">
                        Full payment ({formatCurrency(getRemainingAmount())})
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="partial" />
                      <Label htmlFor="partial" className="cursor-pointer">
                        Partial payment ({formatCurrency(getRemainingAmount() / 2)})
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="cursor-pointer">
                        Custom amount
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMode === "custom" && (
                    <div className="pt-2">
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min={0.01}
                        max={getRemainingAmount()}
                        step={0.01}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter an amount between $0.01 and {formatCurrency(getRemainingAmount())}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="pt-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payment amount: <strong>{formatCurrency(getPaymentAmount())}</strong>
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}
          </div>
        )}
        
        <DialogFooter>
          {paymentStep === 'select' ? (
            <Button variant="outline" onClick={onClose}>Close</Button>
          ) : (
            <div className="flex justify-between w-full">
              <Button 
                variant="outline" 
                onClick={handleBackToSelection}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button 
                onClick={handlePayBill}
                disabled={
                  isSubmitting || 
                  !selectedAccountId || 
                  (paymentMode === "custom" && (!parseFloat(customAmount) || parseFloat(customAmount) <= 0 || parseFloat(customAmount) > getRemainingAmount()))
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatCurrency(getPaymentAmount())}`
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}