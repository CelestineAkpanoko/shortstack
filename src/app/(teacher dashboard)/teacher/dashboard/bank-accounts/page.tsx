"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, ArrowRight, Download, Plus, Search, RefreshCw } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/src/components/ui/breadcrumb";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

import { Separator } from "@/src/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { formatCurrency } from "@/src/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

import AddFundsDialog from "./AddFundsDialog";
import RemoveFundsDialog from "./RemoveFundsDialog";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastLogin: string;
  checking: {
    id: string;
    accountNumber: string;
    balance: number;
  };
  savings: {
    id: string;
    accountNumber: string;
    balance: number;
  };
}

export default function BankAccountsPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isRemoveFundsOpen, setIsRemoveFundsOpen] = useState(false);

  // Fetch teacher's classes
  useEffect(() => {
    async function fetchClasses() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/teacher/classes");
        if (response.ok) {
          const data = await response.json();
          setClasses(data);
          // Auto-select the first class if available
          if (data.length > 0) {
            setSelectedClass(data[0].id);
          }
        } else {
          console.error("Failed to fetch classes:", await response.text());
          toast.error("Failed to load classes");
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Error loading classes");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClasses();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedClass) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/teacher/classes/${selectedClass}/students/accounts`);
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        } else {
          console.error("Failed to fetch students:", await response.text());
          toast.error("Failed to load student accounts");
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Error loading student accounts");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStudents();
  }, [selectedClass]);

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           student.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle selecting all students
  const handleSelectAll = (checked: CheckedState) => {
    if (checked === true) { 
      setSelectedStudents(filteredStudents.map(student => student.id)); 
    } else {
      setSelectedStudents([]);
    }
  };

  // Handle selecting individual student
  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // View student transactions
  const viewStudentTransactions = (studentId: string) => {
    router.push(`/teacher/dashboard/bank-accounts/${studentId}`);
  };

  // Refresh student accounts
  const refreshAccounts = async () => {
    if (!selectedClass) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teacher/classes/${selectedClass}/students/accounts`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        toast.success("Accounts refreshed", {
          description: "Student account information has been updated."
        });
      }
    } catch (error) {
      console.error("Error refreshing accounts:", error);
      toast.error("Refresh failed", {
        description: "Could not update student accounts."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full"> 
      
      <div className="flex-1 overflow-auto"> 
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Bank Accounts</h1>
            <p className="text-gray-500">
              View and manage student bank accounts for your classes
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="w-full sm:w-64">
                <Select
                  value={selectedClass}
                  onValueChange={(value) => {
                    setSelectedClass(value);
                    setSelectedStudents([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button
                size="icon"
                variant="outline"
                onClick={refreshAccounts}
                disabled={isLoading}
                className="shrink-0" 
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 shrink-0"> 
              <Button 
                variant="outline" 
                onClick={() => setIsAddFundsOpen(true)}
                disabled={selectedStudents.length === 0}
              >
                Add Funds
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsRemoveFundsOpen(true)}
                disabled={selectedStudents.length === 0}
              >
                Remove Funds
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-500 text-white">
                      <th className="p-3 text-left w-12">
                        <Checkbox 
                          checked={
                            filteredStudents.length > 0 && 
                            selectedStudents.length === filteredStudents.length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all students"
                        />
                      </th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">E-mail</th>
                      <th className="p-3 text-left">Last Login</th>
                      <th className="p-3 text-right">Checking</th>
                      <th className="p-3 text-right">Savings</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center">
                          Loading student accounts...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="border-t hover:bg-gray-50">
                          <td className="p-3">
                            <Checkbox 
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => { 
                                if (checked) {
                                  setSelectedStudents([...selectedStudents, student.id]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                }
                              }}
                              aria-label={`Select student ${student.firstName} ${student.lastName}`}
                            />
                          </td>
                          <td className="p-3 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                              {student.firstName.charAt(0) + student.lastName.charAt(0)}
                            </div>
                            <span>{student.firstName} {student.lastName}</span>
                          </td>
                          <td className="p-3">{student.email}</td>
                          <td className="p-3">{student.lastLogin}</td>
                          <td className="p-3 text-right">{formatCurrency(student.checking.balance)}</td>
                          <td className="p-3 text-right">{formatCurrency(student.savings.balance)}</td>
                          <td className="p-3">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewStudentTransactions(student.id)}
                                title="View account details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/teacher/dashboard/bank-accounts/statement/${student.id}`)}
                                title="Download statement"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddFundsDialog
        open={isAddFundsOpen}
        onClose={() => setIsAddFundsOpen(false)}
        selectedStudents={students.filter(s => selectedStudents.includes(s.id))}
        onComplete={refreshAccounts}
      />

      <RemoveFundsDialog
        open={isRemoveFundsOpen}
        onClose={() => setIsRemoveFundsOpen(false)}
        selectedStudents={students.filter(s => selectedStudents.includes(s.id))}
        onComplete={refreshAccounts}
      />
    </div>
  );
}
