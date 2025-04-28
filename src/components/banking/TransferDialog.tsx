'use client'

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogHeader
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { ChevronDown, ChevronUp, DollarSign, AlertCircle, ArrowDown } from "lucide-react"
import { Arrow } from "@radix-ui/react-dropdown-menu"

interface TransferDialogProps {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
  onTransferComplete: () => void
}

export default function TransferDialog({
  isOpen,
  onClose,
  accounts,
  onTransferComplete
}: TransferDialogProps) {
  const [fromAccount, setFromAccount] = useState("")
  const [toAccount, setToAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'select' | 'amount'>('select')
  const [error, setError] = useState<string | null>(null)
  
  // Selected account objects
  const selectedFromAccount = accounts.find(acc => acc.id === fromAccount)
  const selectedToAccount = accounts.find(acc => acc.id === toAccount)
  
  // Reset dialog state when opened
  useEffect(() => {
    if (isOpen) {
      // Set default values if accounts are available
      if (accounts && accounts.length >= 2) {
        // Find savings and checking accounts
        const savingsAccount = accounts.find(acc => acc.accountType === "SAVINGS")
        const checkingAccount = accounts.find(acc => acc.accountType === "CHECKING")
        
        if (savingsAccount && checkingAccount) {
          setFromAccount(savingsAccount.id)
          setToAccount(checkingAccount.id)
        } else {
          setFromAccount(accounts[0].id)
          setToAccount(accounts[1].id)
        }
      }
      
      setAmount("")
      setIsSubmitting(false)
      setError(null)
      setStep('select')
    }
  }, [isOpen, accounts])
  
  const handleSubmit = async () => {
    if (!fromAccount || !toAccount || !amount) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/student/banking/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromAccountId: fromAccount,
          toAccountId: toAccount,
          amount: parseFloat(amount)
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Transfer failed');
        return;
      }
      
      toast.success("Transfer successful!");
      onClose();
      
      // Make sure we complete all state updates and dialog closes before refreshing
      setTimeout(() => {
        onTransferComplete();
      }, 100);
      
    } catch (error) {
      console.error("Transfer error:", error);
      setError('Failed to complete transfer');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleClose = () => {
    onClose();
  }
  
  // Swap from and to accounts
  const swapAccounts = () => {
    const temp = fromAccount;
    setFromAccount(toAccount);
    setToAccount(temp);
  }
  
  const goToNextStep = () => {
    setStep('amount');
  }
  
  // No accounts available case
  if (!accounts || accounts.length < 2) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Money</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold mb-4">No accounts available</h2>
            <p className="text-gray-500 mb-4">
              You need at least two accounts to make a transfer.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Transfers</DialogTitle>
        </DialogHeader>
        
        {step === 'select' ? (
          <div className="space-y-6 py-4">
            {/* From section */}
            <div className="space-y-2">
              <p className="font-medium text-gray-700">From</p>
              <div className="relative border rounded-full overflow-hidden">
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full p-4 pl-16 pr-10 bg-white border-0 focus:ring-0 focus:outline-none appearance-none"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountType === "CHECKING" ? "Checkings" : "Savings"} ${account.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedFromAccount?.accountType === "CHECKING" ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Arrow down button */}
            <div className="flex justify-center">
              <button
                onClick={swapAccounts}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none"
                aria-label="Swap accounts"
              >
                <div className="flex flex-col">
                  <ArrowDown size={24} className="text-gray-600" />
                
                </div>
              </button>
            </div>
            
            {/* To section */}
            <div className="space-y-2">
              <p className="font-medium text-gray-700">To</p>
              <div className="relative border rounded-full overflow-hidden">
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full p-4 pl-16 pr-10 bg-white border-0 focus:ring-0 focus:outline-none appearance-none"
                >
                  {accounts.filter(acc => acc.id !== fromAccount).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountType === "CHECKING" ? "Checkings" : "Savings"} ${account.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedToAccount?.accountType === "CHECKING" ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-center">
              <Button 
                onClick={goToNextStep}
                className="rounded-full px-6 py-2"
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div>
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">From</p>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedFromAccount?.accountType === "CHECKING" ? 'bg-green-100' : 'bg-orange-100'
                  } mr-3`}>
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="font-medium">{selectedFromAccount?.accountType === "CHECKING" ? "Checkings" : "Savings"}</p>
                    <p className="text-sm text-gray-500">${selectedFromAccount?.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-1">To</p>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedToAccount?.accountType === "CHECKING" ? 'bg-green-100' : 'bg-orange-100'
                  } mr-3`}>
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="font-medium">{selectedToAccount?.accountType === "CHECKING" ? "Checkings" : "Savings"}</p>
                    <p className="text-sm text-gray-500">${selectedToAccount?.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="text-center">
                  <label htmlFor="amount" className="sr-only">Amount</label>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center pl-4 text-4xl text-gray-400">
                      $
                    </div>
                    <input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => {
                        // Only allow numbers and a single decimal point
                        const value = e.target.value.replace(/[^\d.]/g, '');
                        // Prevent multiple decimal points
                        const decimalCount = (value.match(/\./g) || []).length;
                        if (decimalCount <= 1) {
                          setAmount(value);
                        }
                      }}
                      className="w-full text-center text-6xl py-4 px-12 border-none focus:ring-0 focus:outline-none"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 mb-2 flex items-center justify-center text-red-500 text-sm">
                    <AlertCircle size={16} className="mr-2" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="mt-2 mb-8 relative">
                  <div className="h-2 bg-green-100 rounded-full"></div>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={!amount || isSubmitting || parseFloat(amount) <= 0 || parseFloat(amount) > (selectedFromAccount?.balance || 0)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-3 text-lg"
                  >
                    {isSubmitting ? 
                      "Processing..." : 
                      `Add to ${selectedToAccount?.accountType === "CHECKING" ? "Checkings" : "Savings"}`
                    }
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-center">
              <Button 
                variant="outline"
                onClick={() => setStep('select')}
                disabled={isSubmitting}
                className="rounded-full px-6 mr-2"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}