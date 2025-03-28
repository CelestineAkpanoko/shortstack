"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "react-hot-toast";
import AddAnything from "@/src/components/AddAnything";
import { StudentJoinClass } from "@/src/components/students/StudentJoinClass";
import { Clock } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  code: string;
  emoji: string;
  time: string;
  createdAt: string;
}

export default function StudentClassesPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/student/profile");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/student");
            return;
          }
          throw new Error("Failed to fetch classes");
        }

        const data = await res.json();
        setClasses(data.classes || []);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load your classes");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Classes</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {classes.map((cls) => (
          <Card
            key={cls.id}
            className="w-[250px] h-[250px] cursor-pointer hover:shadow-md transition-shadow flex flex-col"
          >
            <CardHeader className="pb-0 flex-grow">
              <CardTitle className="flex items-center gap-2">
                <span className="text-3xl">{cls.emoji}</span>
                <span className="text-lg truncate">{cls.name}</span>
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">Class Code: {cls.code}</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm flex items-center gap-1">
                <Clock className="h-4 w-4" /> 
                <span>{cls.time || "No time scheduled"} AM</span>
              </p>
            </CardContent>
          </Card>
        ))}
        
        {/* Always show the "Join Class" card */}
        <AddAnything title="Join Class" FormComponent={StudentJoinClass} />
      </div>
    </div>
  );
}