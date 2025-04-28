import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { ArrowLeft, Calendar, Download, Upload } from 'lucide-react';
import { formatDate } from '@/src/lib/utils';
import AssignmentSubmitDialog from '@/src/components/students/AssignmentSubmitDialog';
import { getStudentAssignment } from '@/src/app/actions/assignmentActions';

interface PageProps {
  params: Promise<{ classId: string; lessonId: string; assignmentId: string }>;
}

export default async function StudentAssignmentPage({ params }: PageProps) {
  try {
    // Await the params before destructuring
    const { classId, lessonId, assignmentId } = await params;
    
    console.log(`Loading assignment ${assignmentId} for student`);
    
    // Fetch the actual assignment data
    const assignmentData = await getStudentAssignment(assignmentId);
    
    if (!assignmentData.success || !assignmentData.data) {
      console.error("Failed to load assignment:", assignmentData.error);
      notFound();
    }
    
    const assignment = assignmentData.data;
    console.log(`Assignment loaded: ${assignment.name}`);

    return (
      <main className="container mx-auto px-4 pb-20">
        <div className="mb-6 pt-4">
          <Link href={`/student/dashboard/classes/${classId}/lessons/${lessonId}`}>
            <Button variant="ghost" className="group pl-0">
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              <span>Back to Assignments</span>
            </Button>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-8">
          {assignment.name}
        </h1>
        
        {/* Simplified layout matching the image */}
        <div className="space-y-6 max-w-4xl">
          {/* Grade section */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Grade</h2>
            
            <div className="flex items-center">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="3"
                    strokeDasharray={`${assignment.grade || 0}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-orange-500 text-2xl font-bold">{assignment.grade || 0}%</span>
                </div>
              </div>
              <div className="ml-6">
                <p className="text-orange-500 text-lg">{assignment.grade ? `Grade: ${assignment.grade}%` : 'No grade yet.'}</p>
              </div>
            </div>
          </div>
          
          {/* Due Date section */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Due Date</h2>
            
            <div className="bg-gray-50 py-2 px-6 rounded-full border inline-block">
              {assignment.dueDate ? 
                formatDate(new Date(assignment.dueDate)) : 
                '00 / 00 / 0000'}
            </div>
          </div>
          
          {/* Submission section */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Submission</h2>
            
            <div className="flex flex-wrap gap-3">
              {assignment.url && (
                <a 
                  href={assignment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="no-underline"
                >
                  <Button variant="secondary" className="bg-lime-500 text-white hover:bg-lime-600">
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </a>
              )}
              
              <AssignmentSubmitDialog assignment={{...assignment, id: assignmentId}}>
                <Button type="button" className="bg-lime-500 hover:bg-lime-600">
                  <Upload className="h-4 w-4 mr-2" /> Upload Assignment
                </Button>
              </AssignmentSubmitDialog>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error: any) {
    // Get the params for the error handler, but we need to handle the case
    // where the params Promise itself might have failed
    let classId = "unknown";
    let lessonId = "unknown";
    
    try {
      const resolvedParams = await params;
      classId = resolvedParams.classId;
      lessonId = resolvedParams.lessonId;
    } catch (paramsError) {
      console.error("Failed to resolve params:", paramsError);
    }
    
    console.error("Error in StudentAssignmentPage:", error);
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <p className="font-medium">Failed to load assignment data.</p>
          <p className="text-sm mt-2">{error?.message || "Unknown error"}</p>
        </div>
        <Link href={`/student/dashboard/classes/${classId}/lessons/${lessonId}`}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lesson
          </Button>
        </Link>
      </div>
    );
  }
}