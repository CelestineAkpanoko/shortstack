'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getLessonPlanByID, updateLessonPlan } from '@/src/app/actions/lessonPlansActions';
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


interface LessonPlanDetailProps {
    classId: string;
    planId: string;
  }
  
  export default function LessonPlanDetailPage({ classId, planId }: LessonPlanDetailProps) {
    const [lessonPlan, setLessonPlan] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [error, setError] = useState<string | null>(null);
    const [accordionValue, setAccordionValue] = useState<string | null>(null);  

  // Fetch lesson plan on mount.
  useEffect(() => {
    async function fetchPlan() {
      const res = await getLessonPlanByID(planId);
      if (res.success) {
        setLessonPlan(res.data);
        if (res.data) {
          setForm({
            name: res.data.name,
            description: res.data.description || '',
          });
        }
      } else {
        setError(res.error || null);
      }
    }
    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  // Save handler: update via action function and update state.
  async function handleSave() {
    try {
      // Make a copy of files and assignments before updating
      const currentFiles = lessonPlan.files || [];
      const currentAssignments = lessonPlan.assignments || [];
      
      const res = await updateLessonPlan(planId, {
        name: form.name,
        description: form.description,
      });
      
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

  
  // Cancel editing: reset form to last saved values.
  function handleCancel() {
    if (lessonPlan) {
      setForm({
        name: lessonPlan.name,
        description: lessonPlan.description || '',
      });
    }
    setEditMode(false);
  }

  if (!lessonPlan) return <div>Loading...</div>;

    async function fetchPlan() {
      try {
        const res = await getLessonPlanByID(planId);
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
  return (
    <div className="w-3/4 min-h-screen mx-auto p-6 bg-white shadow-md rounded space-y-6 overflow-y-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/teacher/dashboard' },
          { label: 'Back to Class', href: `/teacher/dashboard/classes/${classId}` },
          { label: lessonPlan.name, href: '#' },
        ]}
      />

      {/* Header: Title, Edit, Save & Cancel */}
      <div className="flex items-center justify-between">
        {editMode ? (
          <div className="flex-1 mr-4">
            <Input
              className="text-xl font-bold"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        ) : (
          <h1 className="text-3xl font-bold">{lessonPlan.name}</h1>
        )}
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

      {/* Description Section */}
      <h2 className="text-xl font-semibold">Description</h2>
      {editMode ? (
        <RichEditor
          content={form.description}
          onChange={(content) => setForm({ ...form, description: content })}
          editable={true}
        />
      ) : (
        <div 
          className="rich-text-content rounded-md"
          dangerouslySetInnerHTML={{ __html: lessonPlan.description || '<p></p>' }} 
        />
      )}

      {/* Accordion for Files & Assignments */}
      <Accordion
        type="single"
        collapsible
        value={accordionValue || undefined}
        onValueChange={(val) => setAccordionValue(val)}
        className="space-y-4"
      >
        {/* Files */}
        <AccordionItem value="files">
          <AccordionTrigger className="bg-orange-500 text-white px-4 py-2 rounded flex justify-between items-center">
            <span className="font-semibold">Files</span>
          </AccordionTrigger>
          <AccordionContent className="mt-2">
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
            {/* File Table */}
            <FileTable 
              files={lessonPlan.files || []} 
              onUpdate={async () => {
                // Refetch the lesson plan to update the UI
                const res = await getLessonPlanByID(planId);
                if (res.success) {
                  setLessonPlan(res.data);
                }
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Assignments */}
        <AccordionItem value="assignments">
          <AccordionTrigger className="bg-orange-500 text-white px-4 py-2 rounded flex justify-between items-center">
            <span className="font-semibold">Assignments</span>
          </AccordionTrigger>
          <AccordionContent className="mt-2">
            <div className="flex justify-end mb-2">
              <UploadAssignmentDialog
                lessonPlanId={lessonPlan.id}
                classId={classId} // Pass the classId prop explicitly
                onAssignmentUploaded={(newAssignment) =>
                  setLessonPlan((prev: any) => ({
                    ...prev,
                    assignments: [...(prev.assignments || []), newAssignment],
                  }))
                }
              />
            </div>
            <AssignmentTable 
              assignments={lessonPlan.assignments || []} 
              onUpdate={() => {
                // Refresh lesson plan data
                fetchPlan();
              }} 
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
