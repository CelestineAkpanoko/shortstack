'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/src/lib/utils"
import TransferDialog from "@/src/components/banking/TransferDialog"
import PayBillDialog from "@/src/components/banking/PayBillDialog"
import TransactionHistory from "@/src/components/banking/TransactionHistory"
import BankStatements from "@/src/components/banking/BankStatements"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { FileText, RefreshCcw, ArrowRight, ArrowRightLeft, FileSignature, Loader2 } from "lucide-react"
import { format } from "date-fns"

const StudentBank = () => {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isPayBillOpen, setIsPayBillOpen] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [showStatements, setShowStatements] = useState(false)
  
  const setupAccounts = async () => {
    try {
      console.log("Setting up new accounts...");
      const response = await fetch('/api/student/banking/setup', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Setup failed:", response.status, errorText);
        return false;
      }
      
      const newAccounts = await response.json();
      console.log("New accounts created:", newAccounts);
      setAccounts(newAccounts);
      
      await fetchTransactions();
      
      return true;
    } catch (error) {
      console.error("Error setting up accounts:", error);
      return false;
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/student/banking/accounts');
      
      if (!response.ok) {
        console.error('Fetch failed:', response.status, await response.text());
        if (response.status === 404) {
          return await setupAccounts();
        }
        return;
      }
      
      const data = await response.json();
      if (data.length === 0) {
        return await setupAccounts();
      } else {
        setAccounts(data);
        await fetchTransactions();
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTransactions = async () => {
    setIsTransactionsLoading(true);
    try {
      const response = await fetch('/api/student/banking/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else {
        console.error('Failed to fetch transactions:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      console.log("Student session info:", {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        name: session.user.name
      });
      fetchAccounts();
    }
  }, [session]);

  const refreshAccounts = async () => {
    setIsLoading(true);
    try {
      console.log("Refreshing accounts...");
      
      setAccounts([]);
      
      const response = await fetch('/api/student/banking/accounts', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Refreshed account data:", data);
        setAccounts(data);
        
        await fetchTransactions();
      } else {
        console.error("Failed to refresh accounts:", await response.text());
      }
    } catch (error) {
      console.error("Failed to refresh accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkingAccount = accounts.find(acc => acc.accountType === "CHECKING");
  const savingsAccount = accounts.find(acc => acc.accountType === "SAVINGS");

  const getDisplayTransactionType = (transaction: any) => {
    if (transaction.transactionType === "DEPOSIT") {
      return "Deposit";
    } else if (transaction.transactionType === "WITHDRAWAL") {
      return "Withdrawn";
    } else if (transaction.transactionType === "TRANSFER_OUT") {
      if (transaction.description?.includes("Transfer from Checking to Savings")) {
        return "Withdrawn";
      }
      return "Transfer";
    } else if (transaction.transactionType === "TRANSFER_IN") {
      return "Transfer";
    } else {
      return transaction.transactionType;
    }
  };
  
  const getTransactionColor = (transaction: any) => {
    const displayType = getDisplayTransactionType(transaction);
    
    switch (displayType) {
      case "Deposit":
        return "text-green-600";
      case "Withdrawn":
        return "text-red-600";
      case "Transfer":
        return "text-blue-600";
      default:
        return "";
    }
  };
  
  const getBadgeBackgroundColor = (transaction: any) => {
    const displayType = getDisplayTransactionType(transaction);
    
    switch (displayType) {
      case "Deposit":
        return "bg-green-100";
      case "Withdrawn":
        return "bg-red-100";
      case "Transfer":
        return "bg-blue-100";
      default:
        return "bg-gray-100";
    }
  };
  
  const formatTransactionAmount = (transaction: any) => {
    const displayType = getDisplayTransactionType(transaction);
    
    switch (displayType) {
      case "Deposit":
        return `+${formatCurrency(transaction.amount)}`;
      case "Withdrawn":
        return `-${formatCurrency(transaction.amount)}`;
      case "Transfer":
        return `•${formatCurrency(transaction.amount)}`;
      default:
        return formatCurrency(transaction.amount);
    }
  };
  
  const getAccountTypeByID = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId)
    return account?.accountType === "CHECKING" ? "Checkings" : "Savings"
  }

  const renderAccountOverview = () => {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-lg overflow-hidden shadow-md border border-gray-100">
            <div className="bg-green-500 p-6 text-white">
              <div className="text-sm font-medium mb-2">Checkings</div>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold ml-2">{formatCurrency(checkingAccount?.balance || 0, false)}</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-md border border-gray-100">
            <div className="bg-orange-500 p-6 text-white">
              <div className="text-sm font-medium mb-2">Savings</div>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold ml-2">{formatCurrency(savingsAccount?.balance || 0, false)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <div 
            onClick={() => setIsPayBillOpen(true)}
            className="bg-white px-6 py-3 rounded-full border shadow-sm flex items-center gap-2 hover:bg-gray-50 cursor-pointer"
          >
            <span className="text-green-600">
              <FileSignature size={20} />
            </span>
            <span>Pay Bills</span>
          </div>
          
          <div 
            onClick={() => setIsTransferOpen(true)}
            className="bg-white px-6 py-3 rounded-full border shadow-sm flex items-center gap-2 hover:bg-gray-50 cursor-pointer"
          >
            <span className="text-green-600">
              <ArrowRightLeft size={20} />
            </span>
            <span>Transfers</span>
          </div>
          
          <div 
            onClick={() => setShowStatements(true)}
            className="bg-white px-6 py-3 rounded-full border shadow-sm flex items-center gap-2 hover:bg-gray-50 cursor-pointer"
          >
            <span className="text-green-600">
              <FileText size={20} />
            </span>
            <span>View Statements</span>
          </div>
        </div>
        
        <Accordion type="single" collapsible defaultValue="recent-transactions" className="mt-8">
          <AccordionItem value="recent-transactions" className="border-none">
            <AccordionTrigger className="bg-orange-500 text-white p-4 rounded-t-lg hover:no-underline hover:bg-orange-600">
              <div className="flex justify-between items-center w-full">
                <h3 className="text-lg font-semibold">Recent Transactions</h3>
                <div 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setShowTransactions(true);
                  }}
                  className="text-white flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>See all</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0 mt-0 border-x border-b rounded-b-lg overflow-hidden bg-white">
              {isTransactionsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No transactions yet
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-orange-500">
                      <th className="py-2 px-4 text-left text-white font-medium">Title</th>
                      <th className="py-2 px-4 text-left text-white font-medium">Type</th>
                      <th className="py-2 px-4 text-center text-white font-medium">Amount</th>
                      <th className="py-2 px-4 text-left text-white font-medium">Account</th>
                      <th className="py-2 px-4 text-center text-white font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 3).map((transaction, index) => {
                      const displayType = getDisplayTransactionType(transaction);
                      const transactionColor = getTransactionColor(transaction);
                      const badgeBackground = getBadgeBackgroundColor(transaction);
                      
                      return (
                        <tr key={transaction.id || index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            {transaction.description || "The Value of Saving"}
                          </td>
                          <td className={`py-3 px-4 ${transactionColor}`}>
                            {displayType}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex px-3 py-1 rounded-full font-medium ${badgeBackground} ${transactionColor}`}>
                              {formatTransactionAmount(transaction)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getAccountTypeByID(transaction.accountId)}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {format(new Date(transaction.createdAt), 'MM/dd/yyyy')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bank Account</h1>
          <p className="text-gray-600">Manage your finances and track spending</p>
        </div>
        <div className="flex items-center gap-2">
          <div 
            onClick={refreshAccounts}
            className={`bg-white px-4 py-2 rounded border flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
            aria-disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <RefreshCcw size={16} />
            )}
            <span>Refresh</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : showTransactions ? (
        // Show full transaction history when viewing all transactions
        <>
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => setShowTransactions(false)}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Back to Accounts
            </button>
          </div>
          <TransactionHistory accounts={accounts} />
        </>
      ) : showStatements ? (
        // Show bank statements when viewing statements
        <>
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => setShowStatements(false)}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Back to Accounts
            </button>
          </div>
          <BankStatements accounts={accounts} />
        </>
      ) : (
        // Show account overview by default
        renderAccountOverview()
      )}
      
      <TransferDialog 
        isOpen={isTransferOpen} 
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts || []}
        onTransferComplete={refreshAccounts}
      />
      <PayBillDialog 
        isOpen={isPayBillOpen} 
        onClose={() => setIsPayBillOpen(false)}
        accounts={accounts || []}
        onPaymentComplete={refreshAccounts}
      />
    </div>
  );
};

export default StudentBank;