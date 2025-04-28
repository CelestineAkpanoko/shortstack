"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, RefreshCw, FileText, Calendar, ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { formatCurrency } from "@/src/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  transactionType: string;
  accountType: string;
  createdAt: string;
  accountId: string;
}

interface StudentAccount {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

interface StudentDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accounts: StudentAccount[];
}

export default function StudentAccountPage({ 
  params 
}: { 
  params: Promise<{ studentId: string }> 
}) {
  const router = useRouter();
  
  // Use React.use() to unwrap the params Promise
  const resolvedParams = use(params); 
  const { studentId } = resolvedParams; 
  
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/teacher/banking/students/${studentId}`);
        if (response.ok) {
          const data = await response.json();
          setStudent(data);
          
          // Set the first account as default
          if (data.accounts.length > 0) {
            setSelectedAccountId(data.accounts[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudentData();
  }, [studentId]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedAccountId) return;
      
      setIsTransactionsLoading(true);
      try {
        const response = await fetch(`/api/teacher/banking/transactions?accountId=${selectedAccountId}`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsTransactionsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [selectedAccountId]);

  // Determine the display type based on transaction type and direction
  const getDisplayTransactionType = (transaction: Transaction) => {
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
  
  const getTransactionColor = (transaction: Transaction) => {
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
  
  const getBadgeBackgroundColor = (transaction: Transaction) => {
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
  
  const formatTransactionAmount = (transaction: Transaction) => {
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
    const account = student?.accounts.find(acc => acc.id === accountId);
    return account?.accountType === "CHECKING" ? "Checkings" : "Savings";
  };

  const refreshTransactions = async () => {
    if (!selectedAccountId) return;
    
    setIsTransactionsLoading(true);
    try {
      const response = await fetch(`/api/teacher/banking/transactions?accountId=${selectedAccountId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    } finally {
      setIsTransactionsLoading(false);
    }
  };

  const downloadStatement = (month: number) => {
    if (!selectedAccountId) return;
    
    const date = new Date(selectedYear, month, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = selectedYear;
    
    // Check if statements exists for the given month/year
    if (month > new Date().getMonth() && year >= new Date().getFullYear()) {
      toast.error("Statements are not yet available for future months");
      return;
    }
    
    // In a real app, you would check if the statement exists first
    toast.error(`No statement records found for ${monthName} ${year}`);
    
    // Uncomment this when statements are available
    // window.location.href = `/api/teacher/banking/statements?accountId=${selectedAccountId}&month=${monthName}&year=${year}&download=true`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading student account details...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Student not found or you don't have permission to view this account.</p>
      </div>
    );
  }

  const checkingAccount = student.accounts.find(acc => acc.accountType === "CHECKING");
  const savingsAccount = student.accounts.find(acc => acc.accountType === "SAVINGS");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-white">
        <div className="flex flex-1 items-center gap-2 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/teacher/dashboard/bank-accounts">
                  Bank Accounts
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {student.firstName} {student.lastName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <div className="flex items-center gap-2 px-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/teacher/dashboard/bank-accounts")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Accounts
          </Button>
        </div>
      </header>
      
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-gray-500">{student.email}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 mb-6">
          {checkingAccount && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle>Checking Account</CardTitle>
                <CardDescription>Account #{checkingAccount.accountNumber}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(checkingAccount.balance)}
                </div>
              </CardContent>
            </Card>
          )}
          
          {savingsAccount && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle>Savings Account</CardTitle>
                <CardDescription>Account #{savingsAccount.accountNumber}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(savingsAccount.balance)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <Card className="bg-white rounded-lg shadow-sm h-auto">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center">
                  <TabsList>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="statements">Statements</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {student.accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountType === "CHECKING" ? "Checking" : "Savings"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="icon" onClick={refreshTransactions} disabled={isTransactionsLoading}>
                      <RefreshCw className={`h-4 w-4 ${isTransactionsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                {/* Transaction Tab Content */}
                <TabsContent value="transactions" className="mt-4 p-0">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Transaction History</h2>
                    <p className="text-sm text-gray-500">
                      Showing transactions for {getAccountTypeByID(selectedAccountId)} account
                    </p>
                  </div>
                  
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-orange-500">
                          <th className="py-2 px-4 text-left text-white font-medium">Date</th>
                          <th className="py-2 px-4 text-left text-white font-medium">Description</th>
                          <th className="py-2 px-4 text-left text-white font-medium">Type</th>
                          <th className="py-2 px-4 text-right text-white font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isTransactionsLoading ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center">
                              <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                            </td>
                          </tr>
                        ) : transactions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                              No transactions found
                            </td>
                          </tr>
                        ) : (
                          transactions.map((transaction) => {
                            const displayType = getDisplayTransactionType(transaction);
                            const transactionColor = getTransactionColor(transaction);
                            const badgeBackground = getBadgeBackgroundColor(transaction);
                            
                            return (
                              <tr key={transaction.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 whitespace-nowrap">
                                  {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-3 px-4">
                                  {transaction.description || "The Value of Saving"}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`${transactionColor}`}>
                                    {displayType}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <span className={`inline-flex px-3 py-1 rounded-full font-medium ${badgeBackground} ${transactionColor}`}>
                                    {formatTransactionAmount(transaction)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                {/* Statements Tab Content */}
                <TabsContent value="statements" className="mt-4 p-0">
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-semibold">Bank Statements</h2>
                        <p className="text-sm text-gray-500">
                          Available statements for {getAccountTypeByID(selectedAccountId)} account
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select 
                          value={selectedYear.toString()} 
                          onValueChange={(val) => setSelectedYear(parseInt(val))}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder={selectedYear.toString()} />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(3)].map((_, i) => {
                              const year = new Date().getFullYear() - i;
                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <div className="divide-y">
                        {Array.from({ length: 12 }, (_, i) => {
                          const date = new Date(selectedYear, i, 1);
                          const monthName = date.toLocaleString('default', { month: 'long' });
                          const currentDate = new Date();
                          const isDisabled = date > currentDate;
                          
                          return (
                            <div 
                              key={i}
                              className={`flex justify-between items-center p-4 hover:bg-gray-50 ${isDisabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                              onClick={() => !isDisabled && downloadStatement(i)}
                            >
                              <div className="flex items-center">
                                <div className={`p-2 rounded-full ${isDisabled ? 'bg-gray-100' : 'bg-green-100'} mr-3`}>
                                  <Calendar className={`h-5 w-5 ${isDisabled ? 'text-gray-400' : 'text-green-600'}`} />
                                </div>
                                <div>
                                  <h3 className="font-medium">{monthName} {selectedYear}</h3>
                                  <p className="text-sm text-gray-500">
                                    {getAccountTypeByID(selectedAccountId)} Account Statement
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={isDisabled ? 'opacity-50 pointer-events-none' : ''}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-500 pt-2">
                      Statements are generated at the end of each month
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}