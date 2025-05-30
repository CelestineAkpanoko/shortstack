"use client";

import { 
  Card, 
  CardContent 
} from '@/src/components/ui/card';
import { StudentClassCard } from '@/src/components/class/StudentClassCard';
import Link from 'next/link';
import { PlusCircle } from "lucide-react";
import { Button } from '@/src/components/ui/button';
import { SessionDebugger } from '@/src/components/debug/SessionDebug';
import { formatCurrency } from "@/src/lib/utils";

// Define the color options for class cards
const CLASS_COLORS = ["primary", "secondary", "success", "warning", "destructive", "default"];

interface ClassSession {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Class {
  id: string;
  name: string;
  code: string;
  emoji: string;
  grade?: string;
  color?: string;
  schedule?: string;
  classSessions?: ClassSession[];
  _count?: {
    enrollments: number;
  };
}

const DaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper function to format class schedules
const formatClassSchedule = (sessions?: ClassSession[]) => {
  if (!sessions || sessions.length === 0) return null;
  
  return sessions.map(session => {
    const day = DaysOfWeek[session.dayOfWeek];
    return `${day} ${session.startTime}-${session.endTime}`;
  }).join(', ');
};

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  schoolEmail: string;
  profileImage?: string | null;
  progress?: {
    completedAssignments: number;
    totalAssignments: number;
    points: number;
    balance: number;
    streak: number;
  } | null;
  teacher?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
}

interface StudentDashboardClientProps {
  student: Student | null;
  classes: Class[];
}

export default function StudentDashboardClient({ student, classes }: StudentDashboardClientProps) {
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!student) return 'ST';
    return `${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`;
  };

  // Process classes to ensure they have colors and counts
  const classesWithColors = classes.map((classItem, index) => {
    // Generate schedule if not already provided
    const schedule = classItem.schedule || formatClassSchedule(classItem.classSessions);
    
    if (!classItem.color) {
      // Use the class item's index to pick a color, or cycle through colors if more classes than colors
      const colorIndex = index % CLASS_COLORS.length;
      return { 
        ...classItem, 
        color: CLASS_COLORS[colorIndex],
        schedule,
        _count: classItem._count || { enrollments: 0 }
      };
    }
    return {
      ...classItem,
      schedule,
      _count: classItem._count || { enrollments: 0 }
    };
  });

  return (
    <div className="w-full">
      <section className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 justify-items-center">
          {classesWithColors.length > 0 ? (
            classesWithColors.slice(0, 3).map((classItem) => (
              <StudentClassCard 
                key={classItem.id}
                id={classItem.id}
                emoji={classItem.emoji}
                name={classItem.name}
                code={classItem.code}
                color={classItem.color}
                grade={classItem.grade}
                schedule={classItem.schedule}
                numberOfStudents={classItem._count?.enrollments}
              />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">You don't have any classes yet.</p>
                <Link href="/student/dashboard/classes">
                  <Button variant="default" className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Join a Class
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          
          {classesWithColors.length > 0 && classesWithColors.length > 3 && (
            <Card className="bg-muted/40 border border-dashed border-muted-foreground/20">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground mb-2">
                  {classesWithColors.length - 3} more classes
                </p>
                <Link href="/student/dashboard/classes">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Progress Cards */}
      <section>
        <h2 className="text-xl md:text-2xl font-semibold mb-4">My Progress</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">
                {student?.progress?.completedAssignments || 0}/{student?.progress?.totalAssignments || 0}
              </p>
              <p className="text-gray-500 text-sm">Completed Assignments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">{student?.progress?.points || 0}</p>
              <p className="text-gray-500 text-sm">Total Points</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">
                {formatCurrency(student?.progress?.balance || 0)}
              </p>
              <p className="text-gray-500 text-sm">Bank Balance</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">{student?.progress?.streak || 0} days</p>
              <p className="text-gray-500 text-sm">Attendance Streak</p>
            </CardContent>
          </Card>
        </div>
        
        <SessionDebugger />
      </section>
    </div>
  );
}