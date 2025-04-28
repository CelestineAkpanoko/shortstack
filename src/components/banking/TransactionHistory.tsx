'use client'

import { useState, useEffect } from "react"
import { 
  Card, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/src/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/src/components/ui/select"
import { Input } from "@/src/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { formatCurrency } from "@/src/lib/utils"
import { format } from "date-fns"

interface TransactionHistoryProps {
  accounts: any[]
}

const TransactionHistory = ({ accounts }: TransactionHistoryProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0]?.id || "")
    }
  }, [accounts, selectedAccountId])
  
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedAccountId) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/student/banking/transactions?accountId=${selectedAccountId}`)
        if (response.ok) {
          const data = await response.json()
          setTransactions(data)
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTransactions()
  }, [selectedAccountId])
  
  // Filter transactions by type and search query
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = 
      filterType === "ALL" || 
      (filterType === "DEPOSIT" && transaction.transactionType === "DEPOSIT") ||
      (filterType === "WITHDRAWAL" && transaction.transactionType === "WITHDRAWAL") ||
      (filterType === "TRANSFER" && (
        transaction.transactionType === "TRANSFER_IN" || 
        transaction.transactionType === "TRANSFER_OUT"
      ))
    
    const matchesSearch = searchQuery === "" || 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesType && matchesSearch
  })
  
  // Determine the display type based on transaction type and direction
  const getDisplayTransactionType = (transaction: any) => {
    if (transaction.transactionType === "DEPOSIT") {
      return "Deposit";
    } else if (transaction.transactionType === "WITHDRAWAL") {
      return "Withdrawn";
    } else if (transaction.transactionType === "TRANSFER_OUT") {
      // For transfers from checking to savings, show as "Withdrawn"
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
  
  // Helper to determine account name from ID
  const getAccountTypeByID = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId)
    return account?.accountType === "CHECKING" ? "Checkings" : "Savings"
  }
  
  return (
    <Card className="w-full h-auto bg-white shadow-md rounded-lg">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>View and search your recent transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <Select 
                value={selectedAccountId} 
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountType === "CHECKING" ? "Checking" : "Savings"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-1/3">
              <Select 
                value={filterType} 
                onValueChange={setFilterType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Transactions</SelectItem>
                  <SelectItem value="DEPOSIT">Deposits</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                  <SelectItem value="TRANSFER">Transfers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-1/3 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="border rounded-md">
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
                  {filteredTransactions.map((transaction) => {
                    const displayType = getDisplayTransactionType(transaction);
                    const transactionColor = getTransactionColor(transaction);
                    const badgeBackground = getBadgeBackgroundColor(transaction);
                    
                    return (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
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
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {selectedAccountId ? "No transactions found" : "Please select an account to view transactions"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TransactionHistory