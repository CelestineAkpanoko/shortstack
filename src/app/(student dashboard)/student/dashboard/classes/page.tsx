"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/src/hooks/use-toast";
import AddAnything from "@/src/components/AddAnything";
import { StudentJoinClass } from "@/src/components/students/StudentJoinClass";
import { StudentClassCard } from "@/src/components/class/StudentClassCard";
import { getStudentClasses } from '@/src/app/actions/studentActions';
import { Card, CardContent } from "@/src/components/ui/card";

// Define the color options for class cards
const CLASS_COLORS = ["primary", "secondary", "success", "warning", "destructive", "default"];

interface ClassSession {
  dayOfWeek: number;  // 0 = Sunday, 1 = Monday, etc.
  startTime: string;  // Format: HH:MM (24hr)
  endTime: string;    // Format: HH:MM (24hr)
}

interface Class {
  id: string;
  name: string;
  code: string;
  emoji: string;
  color?: string | null; // Changed from string? to string | null
  grade?: string | null; // Changed from string? to string | null
  schedule?: string | null;
  classSessions?: ClassSession[];
  createdAt: string;
  _count?: {
    enrollments: number;
  };
  overview?: string | null; // Added this property from the API response
}

const DaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentClassesPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // Format class sessions into a readable schedule string
  const formatClassSchedule = (sessions?: ClassSession[]) => {
    if (!sessions || sessions.length === 0) return null;
    
    return sessions.map(session => {
      const day = DaysOfWeek[session.dayOfWeek];
      return `${day} ${session.startTime}-${session.endTime}`;
    }).join(', ');
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      console.log("Fetching student classes...");
      
      if (status !== "authenticated" || !session?.user) {
        console.error("Not authenticated when fetching classes");
        router.push('/student');
        return;
      }
      
      // Use the getStudentClasses server action
      const result = await getStudentClasses();
      
      if (!result.success) {
        console.error("Failed to fetch classes:", result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to fetch classes",
          variant: "destructive",
        });
        return;
      }
      
      if (!result.data) {
        console.log("No classes found");
        setClasses([]);
        return;
      }
      
      // Format class sessions into readable schedule strings
      const processedClasses = result.data.map((cls: Class, index: number) => {
        // Assign colors to classes if they don't have one
        const colorIndex = index % CLASS_COLORS.length;
        const color = cls.color || CLASS_COLORS[colorIndex];
        
        // Format schedule if classSessions are available
        const schedule = formatClassSchedule(cls.classSessions);
        
        return {
          ...cls,
          color,
          schedule,
          // Ensure the _count property exists
          _count: cls._count || { enrollments: 0 }
        };
      });
      
      setClasses(processedClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error",
        description: "Failed to load your classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchClasses();
    } else if (status === "unauthenticated") {
      router.push('/student');
    }
  }, [status, session]);

  // Handle newly joined class
  const handleClassJoined = (newClass: Class) => {
    // Check if the class already exists in the list
    const classExists = classes.some(c => c.id === newClass.id);
    
    if (!classExists) {
      // Add the new class to the list with a color and empty counts
      const colorIndex = classes.length % CLASS_COLORS.length;
      
      // Format the schedule if it's an array of objects
      let schedule = newClass.schedule;
      if (Array.isArray(schedule)) {
        schedule = schedule.map(session => 
          `${session.day} ${session.startTime}-${session.endTime}`
        ).join(', ');
      }
      
      const coloredClass = {
        ...newClass,
        color: newClass.color || CLASS_COLORS[colorIndex],
        schedule: schedule,
        _count: { enrollments: 0 }
      };
      setClasses(prevClasses => [...prevClasses, coloredClass]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Classes</h1>
        <Button 
          onClick={fetchClasses} 
          variant="outline" 
          size="sm"
        >
          Refresh
        </Button>
      </div> */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <StudentClassCard
              key={cls.id}
              id={cls.id}
              emoji={cls.emoji}
              name={cls.name}
              code={cls.code}
              color={cls.color || undefined}
              grade={cls.grade || undefined}
              schedule={cls.schedule}
              numberOfStudents={cls._count?.enrollments}
            />
          ))
        ) : (
          <Card className="col-span-full w-full">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">You don't have any classes yet.</p>
              <p className="text-sm text-gray-500 mb-4">
                Join a class using the class code provided by your teacher.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Join Class Card */}
        <div className="flex justify-center w-full">
          <AddAnything 
            title="Join Class" 
            FormComponent={StudentJoinClass} 
            onItemAdded={handleClassJoined}
          />
        </div>
      </div>
    </div>
  );
}