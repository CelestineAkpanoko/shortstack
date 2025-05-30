'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/src/hooks/use-toast';
import StudentDashboardClient from './StudentDashboardClient';
import { getStudentClasses } from '@/src/app/actions/studentActions';
import { getStudentOverallProgress } from "@/src/app/actions/gradebookActions";

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
  color?: string;
  grade?: string;
  classSessions?: ClassSession[];
  schedule?: string;
  _count?: {
    enrollments: number;
  };
}

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

const DaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const formatClassSchedule = (sessions?: ClassSession[]) => {
    if (!sessions || sessions.length === 0) return null;
    
    return sessions.map(session => {
      const day = DaysOfWeek[session.dayOfWeek];
      return `${day} ${session.startTime}-${session.endTime}`;
    }).join(', ');
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        if (!session?.user) {
          return;
        }

        // Create student data from session
        const baseStudentData: Student = {
          id: session.user.id,
          firstName: session.user.firstName || 'Student',
          lastName: session.user.lastName || 'User',
          schoolEmail: session.user.email || '',
          profileImage: session.user.image,
          progress: null
        };
        
        setStudent(baseStudentData);
        
        // Try to enhance with profile data
        try {
          const profileResponse = await fetch('/api/student/profile', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.student) {
              const enhancedStudentData = {
                ...baseStudentData,
                ...profileData.student,
                progress: null
              };
              setStudent(enhancedStudentData);
            }
          }
        } catch (profileError) {
          // Continue with base data if profile fetch fails
        }

        // Fetch progress data
        try {
          const progressResult = await getStudentOverallProgress();
          
          if (progressResult.success && progressResult.data?.progress) {
            const progress = progressResult.data.progress;
            
            setStudent(prev => {
              if (!prev) return null;
              return { ...prev, progress };
            });
          } else {
            toast({
              title: "Progress not loaded",
              description: progressResult.error || "Couldn't load your progress data",
              variant: "destructive",
            });
          }
        } catch (progressError) {
          toast({
            title: "Error",
            description: "Failed to load your progress data",
            variant: "destructive",
          });
        }
        
        // Fetch classes
        try {
          const classesResult = await getStudentClasses();
          if (classesResult.success && classesResult.data) {
            const processedClasses = classesResult.data.map((cls: any) => ({
              ...cls,
              schedule: formatClassSchedule(cls.classSessions),
            }));
            setClasses(processedClasses);
          } else {
            toast({
              title: "Classes not loaded",
              description: classesResult.error || "Couldn't load your classes",
              variant: "destructive",
            });
          }
        } catch (classesError) {
          toast({
            title: "Error",
            description: "Failed to load your classes",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && session?.user) {
      fetchStudentData();
    } else if (status === "unauthenticated") {
      router.push('/student');
    }
  }, [router, toast, status, session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load student data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <StudentDashboardClient student={student} classes={classes} />;
}