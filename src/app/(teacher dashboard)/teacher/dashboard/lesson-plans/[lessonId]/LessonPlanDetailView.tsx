'use client';

import { useEffect, useState } from 'react';
import { getLessonPlanByID, updateLessonPlan, updateGenericLessonPlan } from '@/src/app/actions/lessonPlansActions';
import Link from "next/link";
import { ChevronLeft } from 'lucide-react';
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
import { useSession } from 'next-auth/react';
import { Badge } from '@/src/components/ui/badge';

interface LessonPlanDetailViewProps {
  lessonId: string;
}

export default function LessonPlanDetailView({ lessonId }: LessonPlanDetailViewProps) {
  const { data: session } = useSession();
  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [accordionValue, setAccordionValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isTemplate = !!lessonPlan?.genericLessonPlanId || lessonPlan?.__typename === 'GenericLessonPlan';
  const isSuperUser = session?.user?.role === 'SUPER';
  const canEdit = !isTemplate || (isTemplate && isSuperUser);

  // Fetch lesson plan on mount
  useEffect(() => {
    async function fetchPlan() {
      setLoading(true);
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

  if (loading) return <div className="flex justify-center items-center h-96">Loading...</div>;
  if (!lessonPlan) return <div className="flex justify-center items-center h-96">Lesson plan not found</div>;

  return (
    <main className="container mx-auto p-4">

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href="/teacher/dashboard/lesson-plans"
            className="mr-2 flex items-center text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Lesson Plans</span>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full py-8">

      {/* Header: Title, Edit, Save & Cancel */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          {editMode ? (
            <div className="flex-1 mr-4 min-w-[300px]">
              <Input
                className="text-xl font-bold"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          ) : (
            <h1 className="text-3xl font-bold">{lessonPlan.name}</h1>
          )}
          
          {isTemplate && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Template
            </Badge>
          )}
        </div>
        
        {canEdit && (
          <div>
            {editMode ? (
              <div className="flex items-center space-x-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setEditMode(true)}>Edit</Button>
            )}
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        {editMode ? (
          <div className="border rounded-md overflow-hidden">
            <RichEditor
              content={form.description}
              onChange={(content) => setForm({ ...form, description: content })}
              editable={true}
            />
          </div>
        ) : (
          <div 
            className="rich-text-content p-4 border border-gray-200 rounded-md min-h-[150px] bg-white"
            dangerouslySetInnerHTML={{ __html: lessonPlan.description || '<p class="text-gray-400 italic">No description provided</p>' }} 
          />
        )}
      </div>

      {/* Class Information (if not a template) */}
      {!isTemplate && lessonPlan.class && (
        <div className="bg-gray-50 p-4 rounded-md mb-8 border border-gray-200">
          <h3 className="font-medium mb-2">Class Information</h3>
          <p>
            <span className="text-xl mr-2">{lessonPlan.class.emoji || '📚'}</span>
            <span className="font-medium">{lessonPlan.class.name}</span> 
            <span className="text-gray-500 ml-2">(Code: {lessonPlan.class.code})</span>
          </p>
        </div>
      )}

      {/* Accordion for Files & Assignments */}
      <div className="space-y-6">
        <Accordion
          type="single"
          collapsible
          value={accordionValue || undefined}
          onValueChange={(val) => setAccordionValue(val)}
          className="space-y-6"
        >
          {/* Files */}
          <AccordionItem value="files" className="border rounded-md overflow-hidden border-gray-200">
            <AccordionTrigger className="bg-orange-500 text-white px-6 py-3 rounded-t flex justify-between items-center">
              <span className="font-semibold">Files</span>
            </AccordionTrigger>
            <AccordionContent className="p-4">
              {canEdit && (
                <div className="flex justify-end mb-4">
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
                  const res = await getLessonPlanByID(lessonId);
                  if (res.success) {
                    setLessonPlan(res.data);
                  }
                }}
              />
              
              {lessonPlan.files?.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No files have been uploaded yet.
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Assignments - Only show for regular lesson plans */}
          {!isTemplate && (
            <AccordionItem value="assignments" className="border rounded-md overflow-hidden border-gray-200">
              <AccordionTrigger className="bg-orange-500 text-white px-6 py-3 rounded-t flex justify-between items-center">
                <span className="font-semibold">Assignments</span>
              </AccordionTrigger>
              <AccordionContent className="p-4">
                {canEdit && lessonPlan.class && (
                  <div className="flex justify-end mb-4">
                    <UploadAssignmentDialog
                      lessonPlanId={lessonPlan.id}
                      classId={lessonPlan.class.code}
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
                  onUpdate={async () => {
                    // Refetch the lesson plan to update the UI
                    const res = await getLessonPlanByID(lessonId);
                    if (res.success) {
                      setLessonPlan(res.data);
                    }
                  }}
                />
                
                {lessonPlan.assignments?.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No assignments have been created yet.
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mt-6">
            {error}
          </div>
        )}
      </div>
    </div>
    </main>
  );
}