'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/src/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { SessionDebugger } from '@/src/components/debug/SessionDebug';

interface Class {
  id: string;
  name: string;
  code: string;
  emoji: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  schoolEmail: string;
  profileImage?: string | null;
  progress?: any;
  teacher?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch student info and enrolled classes
    const fetchStudentData = async () => {
      try {
        // Log session data to help with debugging
        console.log("Session data:", session);
        
        const res = await fetch('/api/student/profile', {
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Cache-Control': 'no-cache' // Prevent caching
          }
        });
        
        if (!res.ok) {
          console.error(`API error: ${res.status} ${res.statusText}`);
          // Handle unauthorized or other errors
          if (res.status === 401) {
            router.push('/student');
            return;
          }
          throw new Error("Failed to fetch student data");
        }

        const data = await res.json();
        console.log("Student data retrieved:", data);
        
        setStudent(data.student);
        setClasses(data.classes || []);
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast({
          title: "Error",
          description: "Failed to load your dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchStudentData();
    } else if (status === "unauthenticated") {
      router.push('/student');
    }
  }, [router, toast, status, session]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/student' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!student) return 'ST';
    return `${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {student?.firstName} {student?.lastName}!
          </h1>
          <p className="text-gray-600">{student?.schoolEmail}</p>
        </div>
        
        {/* User Avatar and Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-gray-200">
                <AvatarImage 
                  src={student?.profileImage || ''} 
                  alt={`${student?.firstName} ${student?.lastName}`} 
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/student/dashboard/account" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/student/dashboard/account" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Class Cards */}
      <h2 className="text-xl font-semibold mb-4">My Classes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length > 0 ? (
          classes.map((classItem) => (
            <Link key={classItem.id} href={`/student/dashboard/classes/${classItem.code}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <span className="mr-2 text-2xl">{classItem.emoji}</span>
                    {classItem.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Class Code: {classItem.code}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">You don't have any classes yet.</p>
              <p className="text-sm text-gray-500">
                Classes you're enrolled in will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress Cards */}
      <h2 className="text-xl font-semibold mb-4 mt-8">My Progress</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{student?.progress?.completedAssignments || 0}/{student?.progress?.totalAssignments || 0}</p>
            <p className="text-gray-500 text-sm">Completed Assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Session Debugger (only shows in development) */}
      {process.env.NODE_ENV === 'development' && <SessionDebugger />}
    </div>
  );
}