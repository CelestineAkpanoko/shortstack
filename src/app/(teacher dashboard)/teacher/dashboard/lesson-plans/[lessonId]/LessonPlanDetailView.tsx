'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { getLessonPlanByID, updateLessonPlan, updateGenericLessonPlan } from '@/src/app/actions/lessonPlansActions';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/src/components/ui/accordion';
import UploadFileDialog from '@/src/components/lessonPlans/UploadFileDialog';
import FileTable from '@/src/components/lessonPlans/FileTable';
import UploadAssignmentDialog from '@/src/components/lessonPlans/UploadAssignmentDialog';
import AssignmentTable from '@/src/components/lessonPlans/AssignmentTable';
import RichEditor from '@/src/components/RichEditor';
import { Pen, ChevronLeft } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';

interface LessonPlanDetailViewProps {
  lessonId: string;
}

export default function LessonPlanDetailView({ lessonId }: LessonPlanDetailViewProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [accordionValue, setAccordionValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isTemplate = !!lessonPlan?.genericLessonPlanId || lessonPlan?.__typename === 'GenericLessonPlan';
  const isSuperUser = session?.user?.role === 'SUPER';
  const canEdit = !isTemplate || (isTemplate && isSuperUser);

  // Get back navigation URL
  const getBackUrl = () => {
    const fromTab = searchParams.get('from');
    const grade = searchParams.get('grade');
    const classCode = searchParams.get('classCode');
    
    // If coming from a class context
    if (classCode) {
      return `/teacher/dashboard/classes/${classCode}?tab=lessonPlans`;
    }
    
    // If coming from templates tab
    if (fromTab === 'templates') {
      const gradeParam = grade ? `?tab=templates&grade=${grade}` : '?tab=templates';
      return `/teacher/dashboard/lesson-plans${gradeParam}`;
    }
    
    // Default to my plans tab
    return '/teacher/dashboard/lesson-plans?tab=my-plans';
  };

  const getBackLabel = () => {
    const fromTab = searchParams.get('from');
    const grade = searchParams.get('grade');
    const classCode = searchParams.get('classCode');
    
    if (classCode) {
      return 'Back to Class Lesson Plans';
    }
    
    if (fromTab === 'templates') {
      return grade && grade !== 'all' 
        ? `Back to Templates (Grades ${grade})`
        : 'Back to Templates';
    }
    
    return 'Back to My Lesson Plans';
  };

  // Fetch lesson plan on mount
  useEffect(() => {
    async function fetchPlan() {
      setLoading(true);
      try {
        const res = await getLessonPlanByID(lessonId);
        if (res.success) {
          // Check if this is actually a template and redirect if needed
          if (res.data.__typename === 'GenericLessonPlan') {
            const fromTab = searchParams.get('from') || 'templates';
            const grade = searchParams.get('grade') || 'all';
            window.location.href = `/teacher/dashboard/lesson-plans/templates/${lessonId}?from=${fromTab}&grade=${grade}`;
            return;
          }
          
          setLessonPlan(res.data);
          if (res.data) {
            setForm({
              name: res.data.name,
              description: res.data.description || '',
            });
          }
          setError(null);
        } else {
          setError(res.error || 'Failed to fetch lesson plan');
        }
      } catch (error: any) {
        setError(error.message || 'An unexpected error occurred');
        console.error('Error fetching lesson plan:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (lessonId) {
      fetchPlan();
    }
  }, [lessonId]);

  // Save handler: update via action function and update state
  async function handleSave() {
    try {
      // Make a copy of files and assignments before updating
      const currentFiles = lessonPlan.files || [];
      const currentAssignments = lessonPlan.assignments || [];
      
      // Determine if we're updating a regular lesson plan or a template
      let res;
      if (isTemplate && isSuperUser) {
        res = await updateGenericLessonPlan(lessonId, {
          name: form.name,
          description: form.description,
        });
      } else {
        res = await updateLessonPlan(lessonId, {
          name: form.name,
          description: form.description,
        });
      }
      
      if (res.success) {
        // Update lesson plan but preserve files and assignments
        setLessonPlan({
          ...res.data,
          files: currentFiles,
          assignments: currentAssignments
        });
        setEditMode(false);
        setError(null);
      } else {
        setError(res.error || null);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update lesson plan');
    }
  }

  // Cancel editing: reset form to last saved values
  function handleCancel() {
    if (lessonPlan) {
      setForm({
        name: lessonPlan.name,
        description: lessonPlan.description || '',
      });
    }
    setEditMode(false);
  }
  
  // Refetch lesson plan data
  async function fetchPlan() {
    try {
      const res = await getLessonPlanByID(lessonId);
      if (res.success) {
        setLessonPlan(res.data);
        if (res.data) {
          setForm({
            name: res.data.name,
            description: res.data.description || '',
          });
        }
        setError(null);
      } else {
        setError(res.error || 'Failed to fetch lesson plan');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
      console.error('Error fetching lesson plan:', error);
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  if (!lessonPlan) return <div className="flex justify-center items-center min-h-[60vh]">Lesson plan not found</div>;

  return (
    <div className="w-full h-[100vh] lg:w-5/6 xl:w-3/4 mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
      {/* Breadcrumbs - hidden on mobile */}
      <div className="hidden sm:block">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/teacher/dashboard' },
            { label: getBackLabel(), href: getBackUrl() },
            { label: lessonPlan.name, href: '#' },
          ]}
        />
      </div>

      {/* Mobile Back Link */}
      <div className="sm:hidden mb-2">
        <Button variant="ghost" className="p-0 h-auto" asChild>
          <Link href={getBackUrl()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {getBackLabel()}
          </Link>
        </Button>
      </div>

      {/* Desktop Back Button */}
      {/* <div className="hidden sm:block">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href={getBackUrl()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {getBackLabel()}
          </Link>
        </Button>
      </div> */}

      {/* Header: Title, Type Badge, Edit, Save & Cancel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {editMode ? (
            <div className="flex-1 w-full sm:mr-4">
              <Input
                className="text-xl font-bold"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-bold break-words">{lessonPlan.name}</h1>
          )}
          
          {/* Show template badge if applicable */}
          {isTemplate && (
            <Badge className="bg-blue-100 text-blue-700 self-start">Template</Badge>
          )}
        </div>
        
        {canEdit && (
          editMode ? (
            <div className="flex items-center gap-2 self-end">
              <Button onClick={handleSave} size="sm" className="bg-orange-500 hover:bg-orange-600">Save</Button>
              <Button variant="secondary" onClick={handleCancel} size="sm">
                Cancel
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setEditMode(true)} 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600 self-end"
            >
              <Pen className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )
        )}
      </div>

      {/* Description Section */}
      <h2 className="text-lg sm:text-xl font-semibold">Description</h2>
      {editMode ? (
        <RichEditor
          content={form.description}
          onChange={(content) => setForm({ ...form, description: content })}
          editable={true}
        />
      ) : (
        <div 
          className="rich-text-content rounded-md max-w-full overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: lessonPlan.description || '<p></p>' }} 
        />
      )}

      {/* Accordion for Files & Assignments */}
      <Accordion
        type="single"
        collapsible
        value={accordionValue || undefined}
        onValueChange={(val) => setAccordionValue(val)}
        className="space-y-3 sm:space-y-4"
      >
        {/* Files */}
        <AccordionItem value="files" className="border-none">
          <AccordionTrigger className="bg-orange-500 text-white px-3 sm:px-4 py-2 rounded flex justify-between items-center">
            <span className="font-semibold">Files</span>
          </AccordionTrigger>
          <AccordionContent className="mt-2 overflow-x-auto">
            {canEdit && (
              <div className="flex justify-end mb-2">
                <UploadFileDialog
                  lessonPlanId={lessonPlan.id}
                  onFileUploaded={(newFile) =>
                    setLessonPlan((prev: any) => ({
                      ...prev,
                      files: [...(prev.files || []), newFile],
                    }))
                  }
                />
              </div>
            )}
            {/* File Table */}
            <FileTable 
              files={lessonPlan.files || []} 
              onUpdate={async () => {
                // Refetch the lesson plan to update the UI
                await fetchPlan();
              }}
            />
            
            {(!lessonPlan.files || lessonPlan.files.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                No files have been uploaded yet.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Assignments - only show for normal lesson plans */}
        {!isTemplate && (
          <AccordionItem value="assignments" className="border-none">
            <AccordionTrigger className="bg-orange-500 text-white px-3 sm:px-4 py-2 rounded flex justify-between items-center">
              <span className="font-semibold">Assignments</span>
            </AccordionTrigger>
            <AccordionContent className="mt-2 overflow-x-auto">
              {canEdit && (
                <div className="flex justify-end mb-2">
                  <UploadAssignmentDialog
                    lessonPlanId={lessonPlan.id}
                    classId={lessonPlan.class?.code}
                    onAssignmentUploaded={(newAssignment) =>
                      setLessonPlan((prev: any) => ({
                        ...prev,
                        assignments: [...(prev.assignments || []), newAssignment],
                      }))
                    }
                  />
                </div>
              )}
              <AssignmentTable 
                assignments={lessonPlan.assignments || []} 
                onUpdate={() => {
                  // Refresh lesson plan data
                  fetchPlan();
                }} 
              />
              
              {(!lessonPlan.assignments || lessonPlan.assignments.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  No assignments have been created yet.
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}