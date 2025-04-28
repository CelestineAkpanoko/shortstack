"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { formatCurrency } from "@/src/lib/utils";
import Link from "next/link";
import { 
  ChevronLeft, 
  AlertCircle, 
  CalendarDays, 
  Clock, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  Receipt,
  Minus
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Progress } from "@/src/components/ui/progress";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import RemoveBillFromClassesDialog from "@/src/components/bills/RemoveBillFromClassesDialog";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";

interface BillClass {
  id: string;
  name: string;
  emoji: string;
  code: string;
}

interface StudentBill {
  studentId: string;
  billId: string;
  isPaid: boolean;
  paidAt: Date | null;
  student: {
    id: string;
    name: string;
    email: string;
    class?: {
      id: string;
      name: string;
      emoji: string;
    }
  }
}

interface BillDetailClientProps {
  bill: any; // Type this properly based on your data structure
}

export function BillDetailClient({ bill }: BillDetailClientProps) {
  const [showRemoveClassDialog, setShowRemoveClassDialog] = useState(false);

  // Format the frequency for display
  const formatFrequency = (freq: string) => {
    switch (freq) {
      case "ONCE": return "One Time";
      case "WEEKLY": return "Weekly";
      case "BIWEEKLY": return "Bi-weekly";
      case "MONTHLY": return "Monthly";
      case "QUARTERLY": return "Quarterly";
      case "YEARLY": return "Yearly";
      default: return freq;
    }
  };
  
  // Calculate payment statistics
  const totalStudents = bill.students?.length || 0;
  const paidStudents: number = bill.students?.filter((s: StudentBill) => s.isPaid).length || 0;
  const unpaidStudents = totalStudents - paidStudents;
  const paymentPercentage = totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0;
  
  // Calculate total amount collected and pending
  const totalAmount = bill.amount * totalStudents;
  const collectedAmount = bill.amount * paidStudents;
  const pendingAmount = bill.amount * unpaidStudents;
  
  // Group students by class for better organization
  const studentsByClass = bill.students?.reduce((acc: Record<string, { classInfo: any, students: StudentBill[] }>, studentBill: StudentBill) => {
    const className = studentBill.student.class?.name || "Unassigned";
    if (!acc[className]) {
      acc[className] = {
        classInfo: studentBill.student.class || { id: "none", name: "Unassigned", emoji: "❓" },
        students: []
      };
    }
    acc[className].students.push(studentBill);
    return acc;
  }, {} as Record<string, { classInfo: any, students: StudentBill[] }>);

  // Format date for display
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get due date status
  const isDue = new Date(bill.dueDate) <= new Date();
  const daysUntilDue = Math.ceil((new Date(bill.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const dueDateStatus = isDue 
    ? <Badge variant="destructive">Due</Badge>
    : <Badge variant="outline">{daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left</Badge>;

  // For recurring bills, calculate next occurrence
  const getNextOccurrence = () => {
    if (bill.frequency === "ONCE") return null;
    
    const dueDate = new Date(bill.dueDate);
    const today = new Date();
    
    if (dueDate > today) return dueDate; // Next occurrence is the current due date
    
    // Calculate next occurrence based on frequency
    const nextDate = new Date(dueDate);
    switch (bill.frequency) {
      case "WEEKLY":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "BIWEEKLY":
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case "MONTHLY":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "QUARTERLY":
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case "YEARLY":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    // If next date is in the past, keep adding periods until it's in the future
    while (nextDate < today) {
      switch (bill.frequency) {
        case "WEEKLY":
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "BIWEEKLY":
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case "MONTHLY":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "QUARTERLY":
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case "YEARLY":
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
    }
    
    return nextDate;
  };
  
  const nextOccurrence = getNextOccurrence();

  return (
    <main className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/teacher/dashboard/bills" className="mr-2 flex items-center text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" />
            <span>Back to bills</span>
          </Link>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <span className="text-4xl mr-3">{bill.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold">{bill.title}</h1>
              <p className="text-gray-600">
                {formatFrequency(bill.frequency)} • 
                <span className="ml-1">{formatDate(bill.dueDate)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={bill.status === "PAID" ? "default" : 
                          bill.status === "PENDING" ? "outline" : 
                          bill.status === "OVERDUE" ? "destructive" : "secondary"}>
              {bill.status}
            </Badge>
            {dueDateStatus}
          </div>
        </div>
        
        {/* The rest of your component remains the same */}
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Card content... */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  <span>Total Value</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span className="text-green-600 font-medium">{formatCurrency(collectedAmount)}</span>
                <span className="mx-1">collected</span>•
                <span className="ml-1 text-amber-600 font-medium">{formatCurrency(pendingAmount)}</span>
                <span className="ml-1">pending</span>
              </div>
            </CardContent>
          </Card>
          
          {/* ...second and third cards... */}
          {/* Continue with your other cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Student Payments</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-2xl font-bold">{paidStudents}/{totalStudents}</p>
                <p className="text-xl font-bold text-gray-500">{paymentPercentage}%</p>
              </div>
              <Progress value={paymentPercentage} className="h-2 mt-2" />
              <div className="mt-1 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">{paidStudents} paid</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-amber-600" />
                  <span className="text-amber-600">{unpaidStudents} unpaid</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  <span>Billing Schedule</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">
                {formatFrequency(bill.frequency)}
              </p>
              {bill.frequency !== "ONCE" && nextOccurrence && (
                <>
                  <p className="mt-1 text-sm flex items-center text-gray-700">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Next: </span>
                    <span className="ml-1 font-medium">
                      {formatDate(nextOccurrence)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Recurring {formatFrequency(bill.frequency).toLowerCase()} bill
                  </p>
                </>
              )}
              {bill.frequency === "ONCE" && (
                <p className="mt-1 text-xs text-gray-500">
                  One-time payment due {formatDate(bill.dueDate)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="details" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Bill Details</TabsTrigger>
            <TabsTrigger value="classes">Classes ({bill.class?.length || 0})</TabsTrigger>
            <TabsTrigger value="students">
              Students ({totalStudents})
            </TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>
          
          {/* Bill Details Tab */}
          <TabsContent value="details" className="mt-0">
            {/* ...content... */}
            <Card className="overflow-visible h-auto w-full">
              <CardContent className="pt-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <p className="text-gray-600">Amount per student</p>
                        <p className="font-medium">{formatCurrency(bill.amount)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Due Date</p>
                        <p className="font-medium">{formatDate(bill.dueDate)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Frequency</p>
                        <p className="font-medium">{formatFrequency(bill.frequency)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Status</p>
                        <p className="font-medium">{bill.status}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Created</p>
                        <p className="font-medium">{formatDate(bill.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Collection Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <p className="text-gray-600">Total Students</p>
                        <p className="font-medium">{totalStudents}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Paid</p>
                        <p className="font-medium text-green-600">{paidStudents} ({paymentPercentage}%)</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Unpaid</p>
                        <p className="font-medium text-amber-600">{unpaidStudents} ({100 - paymentPercentage}%)</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Total Collected</p>
                        <p className="font-medium text-green-600">{formatCurrency(collectedAmount)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Outstanding</p>
                        <p className="font-medium text-amber-600">{formatCurrency(pendingAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {bill.description && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{bill.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Classes Tab */}
          <TabsContent value="classes" className="mt-0">
            <Card className="overflow-visible h-auto w-full">
              <CardContent className="pt-6 pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Assigned Classes</h3>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowRemoveClassDialog(true)}
                    disabled={!bill.class?.length}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Unassign from Classes
                  </Button>
                </div>
                
                {bill.class && bill.class.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bill.class.map((cls: BillClass) => (
                      <div key={cls.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{cls.emoji}</span>
                          <div>
                            <Link 
                              href={`/teacher/dashboard/classes/${cls.code}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {cls.name}
                            </Link>
                            <p className="text-sm text-gray-600">Code: {cls.code}</p>
                          </div>
                        </div>
                        
                        {/* Show student stats for this class if available */}
                        {studentsByClass && studentsByClass[cls.name] && (
                          <div className="mt-2 text-sm">
                            <p className="text-gray-600">
                              {studentsByClass[cls.name].students.length} students assigned
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">
                                  {studentsByClass[cls.name].students.filter((s: StudentBill) => s.isPaid).length} paid
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-amber-600" />
                                <span className="text-amber-600">
                                  {studentsByClass[cls.name].students.filter((s: StudentBill) => !s.isPaid).length} unpaid
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">This bill is not assigned to any classes</p>
                    <p className="text-sm text-gray-400 mt-1">
                      You can assign this bill to classes to collect payments from students
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <RemoveBillFromClassesDialog
              isOpen={showRemoveClassDialog}
              onClose={() => setShowRemoveClassDialog(false)}
              billId={bill.id}
              billTitle={bill.title}
              assignedClasses={bill.class || []}
            />
          </TabsContent>
          
          {/* Continue with the Students tab and Payment History tab... */}
          {/* Students Tab */}
          <TabsContent value="students" className="mt-0">
            {/* Students tab content... */}
            <Card className="overflow-visible h-auto w-full">
              <CardContent className="pt-6 pb-6">
                {/* Student content here */}
                {totalStudents > 0 ? (
                  <div>
                    {/* Search/filter options could be added here */}
                    <div className="overflow-x-auto">
                      {studentsByClass && Object.keys(studentsByClass).length > 0 ? (
                        <div className="space-y-6">
                          {Object.keys(studentsByClass).map(className => (
                            <div key={className}>
                              <div className="flex items-center mb-2">
                                <span className="text-xl mr-2">
                                  {studentsByClass[className].classInfo.emoji || "❓"}
                                </span>
                                <h3 className="text-lg font-semibold">{className}</h3>
                              </div>
                              
                              <div className="rounded-lg border overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Student</th>
                                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Email</th>
                                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Payment Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {studentsByClass[className].students.map((studentBill: StudentBill) => (
                                      <tr key={studentBill.studentId} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">{studentBill.student.name}</td>
                                        <td className="py-3 px-4 text-gray-500">
                                          {studentBill.student.email || "-"}
                                        </td>
                                        <td className="py-3 px-4">
                                          <Badge variant={studentBill.isPaid ? "default" : "outline"}>
                                            {studentBill.isPaid ? "Paid" : "Unpaid"}
                                          </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">
                                          {studentBill.paidAt ? formatDate(studentBill.paidAt) : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-8 text-gray-500">No student data available</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No students assigned to this bill</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payment History Tab */}
          <TabsContent value="payments" className="mt-0">
            {/* Payment history tab content... */}
            <Card className="overflow-visible h-auto w-full">
              <CardContent className="pt-6 pb-6">
                {/* Payment history content here */}
                {paidStudents > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Payment Timeline</h3>
                    <div className="space-y-4">
                      {/* Group and sort paid students by payment date */}
                      {(bill.students as StudentBill[])
                        ?.filter((sb: StudentBill) => sb.isPaid && sb.paidAt)
                        .sort((a, b) => new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime())
                        .map((studentBill, idx) => (
                          <div key={studentBill.studentId} className="flex items-start gap-3 pb-4">
                            <div className="mt-0.5 bg-green-100 rounded-full p-1">
                              <Receipt className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <p className="font-medium">{studentBill.student.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {studentBill.student.class?.name || "No Class"} • {formatCurrency(bill.amount)}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-500 whitespace-nowrap">
                                  {formatDate(studentBill.paidAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                    
                    {/* Add payment analytics section */}
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        <span>Payment Analytics</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-gray-50 overflow-visible h-auto">
                          <CardContent className="pt-6 pb-6">
                            <h4 className="text-base font-medium mb-2">Collection Rate</h4>
                            <div className="flex items-end gap-2">
                              <p className="text-2xl font-bold">{paymentPercentage}%</p>
                              <p className="text-sm text-gray-500 pb-1">of students have paid</p>
                            </div>
                            <Progress value={paymentPercentage} className="h-2 mt-3" />
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 overflow-visible h-auto">
                          <CardContent className="pt-6 pb-6">
                            <h4 className="text-base font-medium mb-2">Amount Collected</h4>
                            <div className="flex items-end gap-2">
                              <p className="text-2xl font-bold">{formatCurrency(collectedAmount)}</p>
                              <p className="text-sm text-gray-500 pb-1">of {formatCurrency(totalAmount)}</p>
                            </div>
                            <Progress 
                              value={totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0} 
                              className="h-2 mt-3" 
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No payment history available yet</p>
                    {totalStudents > 0 && (
                      <p className="text-sm text-gray-400 mt-1">
                        {totalStudents} students have been assigned this bill but none have paid
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}