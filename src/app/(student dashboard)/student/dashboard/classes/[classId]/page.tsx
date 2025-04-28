"use client";

import { useParams } from 'next/navigation';
import { getClassData } from '@/src/app/actions/classActions';
import StudentClassTabs from '@/src/components/students/StudentClassTabs';
import { useState, useEffect } from 'react';

export default function StudentClassPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [classData, setClassData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching data for class code:", classId);
        const response = await getClassData(classId);
        console.log("getClassData response received");
        
        if (!response.success || !response.data) {
          console.error("Failed to load class data:", response.error);
          setError(response.error || "Unable to load class data");
        } else {
          setClassData(response.data);
          console.log("Class data loaded successfully:", response.data.name);
        }
      } catch (error: any) {
        console.error("Error in StudentClassPage:", error);
        setError(error.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [classId]);

  if (isLoading) {
    return <div className="container mx-auto p-6 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-500">{error}</p>
        {error.includes("Forbidden") && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">
              You need to be enrolled in this class to view its content.
            </p>
            <a 
              href="/student/dashboard/classes" 
              className="text-blue-600 hover:underline"
            >
              Return to My Classes
            </a>
          </div>
        )}
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">
          {classData.emoji} {classData.name}
        </h1>
        <p className="mb-4 text-gray-600">
          Teacher: {classData.user?.firstName || classData.user?.name || "Unknown"} {classData.user?.lastName || ""}
        </p>
        <p className="mb-4 text-gray-600">
          Students: {classData._count?.enrollments || 0}
        </p>
        
        <StudentClassTabs classData={classData} />
      </div>
    </main>
  );
}