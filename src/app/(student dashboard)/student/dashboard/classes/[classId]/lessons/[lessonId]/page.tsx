import { getStudentLessonById } from '@/src/app/actions/studentLessonActions';
import { Button } from '@/src/components/ui/button';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, Download, Book, Clock } from 'lucide-react';
import { formatDate } from '@/src/lib/utils';

interface PageParams {
  params: Promise<{
    classId: string;
    lessonId: string;
  }>;
}

// Updated to use proper interface instead of Promise
export default async function StudentLessonPage(props: PageParams) {
  const params = await props.params;
  try {
    const { classId, lessonId } = params;
    
    if (!classId || !lessonId) {
      console.log("Missing classId or lessonId parameters");
      notFound();
    }
    
    console.log(`Fetching lesson ${lessonId} for class ${classId}`);
    
    const response = await getStudentLessonById(lessonId);
    console.log("Lesson response:", response.success);
    
    if (!response.success || !response.data) {
      console.log("Lesson not found or access denied:", response.error);
      notFound();
    }
    
    const lesson = response.data;
    console.log("Lesson loaded:", lesson.name);

    return (
      <main className="container mx-auto px-4 pb-20">
        <div className="mb-6 sm:mb-8 pt-4">
          <Link href={`/student/dashboard/classes/${classId}`}>
            <Button variant="ghost" className="group pl-0 sm:pl-2">
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm sm:text-base">Back to {lesson.class.name}</span>
            </Button>
          </Link>
        </div>
        
        {/* Hero section - Mobile optimized */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
            <Book className="h-4 w-4" />
            <span>Lesson</span>
            <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground"></span>
            <Clock className="h-3 w-3" />
            <span>{formatDate(new Date(lesson.createdAt))}</span>
          </div>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <span>{lesson.class.emoji}</span>
            <span>{lesson.name}</span>
          </h1>
          
          {/* Stats row - Responsive */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
            <div className="bg-background/80 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-md flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span>{lesson.assignments?.length || 0} Assignments</span>
            </div>
            
            <div className="bg-background/80 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-md flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span>{lesson.files?.length || 0} Materials</span>
            </div>
          </div>
        </div>
        
        {/* Main content - Responsive grid/stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left column - Lesson content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-b">
                <h2 className="text-lg sm:text-xl font-semibold">Lesson Content</h2>
              </div>
              <div className="p-4 sm:p-6">
                {lesson.description ? (
                  <div 
                    className="prose prose-sm sm:prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: lesson.description }}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8 sm:py-10">
                    No content available for this lesson.
                  </p>
                )}
              </div>
            </div>
            
            {/* Enhanced Assignments section */}
            {lesson.assignments && lesson.assignments.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-b">
                  <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Assignments
                  </h2>
                </div>
                <div className="divide-y">
                  {lesson.assignments.map((assignment: any) => (
                    <div key={assignment.id} className="p-4 sm:p-6">
                      <Link href={`/student/dashboard/classes/${classId}/lessons/${lessonId}/assignments/${assignment.id}`}>
                        <div className="cursor-pointer transition-colors hover:bg-muted/20 -mx-4 -my-4 sm:-mx-6 sm:-my-6 p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div>
                              <h3 className="text-base sm:text-lg font-medium text-primary hover:text-primary/80 transition-colors">
                                {assignment.name}
                              </h3>
                              {assignment.activity && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                                  <p className="text-sm text-muted-foreground">{assignment.activity}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 items-center">
                              {assignment.dueDate && (
                                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                  Due: {formatDate(new Date(assignment.dueDate))}
                                </div>
                              )}
                              
                            </div>
                          </div>
                          
                          
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Materials and resources */}
          <div className="space-y-4 sm:space-y-6">
            {/* Materials/Files section */}
            {lesson.files && lesson.files.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-b">
                  <h2 className="text-lg sm:text-xl font-semibold">Materials</h2>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="space-y-1">
                    {lesson.files.map((file: any) => (
                      <a 
                        key={file.id}
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        download
                        className="block group"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          {/* File type icon */}
                          <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                            {getFileIcon(file.fileType)}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.fileType} • {formatFileSize(file.size)}
                            </p>
                          </div>
                          
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Class info card */}
            <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-b">
                <h2 className="text-lg sm:text-xl font-semibold">Class Info</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-full flex items-center justify-center text-lg sm:text-xl">
                    {lesson.class.emoji || '📚'}
                  </div>
                  <div>
                    <h3 className="font-medium">{lesson.class.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Class Code: {lesson.class.code}</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Link href={`/student/dashboard/classes/${classId}`}>
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      <ArrowLeft className="h-3 w-3 mr-1.5" />
                      Back to Class Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error in StudentLessonPage:", error);
    return (
      <div className="container mx-auto p-4 sm:p-6 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <p className="font-medium">Failed to load lesson data. Please try again later.</p>
          <p className="text-sm mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
        <Link href={`/student/dashboard/classes/${params.classId}`}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Button>
        </Link>
      </div>
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper function to get an icon based on file type
function getFileIcon(fileType: string) {
  if (!fileType) return <FileText className="h-4 w-4 sm:h-5 sm:w-5" />;
  
  const type = fileType.toLowerCase();
  
  if (type.includes('pdf')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M9 15v-4"></path>
        <path d="M12 15v-6"></path>
        <path d="M15 15v-2"></path>
      </svg>
    );
  }
  
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    );
  }
  
  if (type.includes('doc') || type.includes('word')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M16 13H8"></path>
        <path d="M16 17H8"></path>
        <path d="M10 9H8"></path>
      </svg>
    );
  }
  
  if (type.includes('xls') || type.includes('excel') || type.includes('spreadsheet')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M8 13h2"></path>
        <path d="M8 17h2"></path>
        <path d="M14 13h2"></path>
        <path d="M14 17h2"></path>
      </svg>
    );
  }
  
  // Default file icon
  return <FileText className="h-4 w-4 sm:h-5 sm:w-5" />;
}