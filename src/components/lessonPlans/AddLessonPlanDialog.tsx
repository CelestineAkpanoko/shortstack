'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { createLessonPlan, copyGenericLessonPlanToUser } from '@/src/app/actions/lessonPlansActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ClassItem {
  id: string;
  code: string;
  name: string;
  emoji: string;
}

interface GenericLessonPlan {
  id: string;
  name: string;
  description?: string;
}

interface AddLessonPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialClassCode?: string; // Optional now, as class will be selected in dialog
}

export default function AddLessonPlanDialog({
  isOpen,
  onClose,
  onSuccess,
  initialClassCode,
}: AddLessonPlanDialogProps) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scratch' | 'template'>('scratch');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>(''); // New state for template-based name
  const [templates, setTemplates] = useState<GenericLessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New states for class selection
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState<string>(initialClassCode || '');
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Fetch classes when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      fetchGenericLessonPlans();
    }
  }, [isOpen, initialClassCode]);

  // Update templateName when a template is selected
  useEffect(() => {
    if (selectedTemplateId) {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        setTemplateName(selectedTemplate.name);
      }
    } else {
      setTemplateName('');
    }
  }, [selectedTemplateId, templates]);

  async function fetchClasses() {
    setIsLoadingClasses(true);
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data.classes || []);
      
      // If initialClassCode is provided, select it by default
      if (initialClassCode && !selectedClassCode) {
        setSelectedClassCode(initialClassCode);
      } else if (data.classes?.length > 0 && !selectedClassCode) {
        // Otherwise select first class by default if there's no selection yet
        setSelectedClassCode(data.classes[0].code);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error("Couldn't load your classes");
    } finally {
      setIsLoadingClasses(false);
    }
  }

  async function fetchGenericLessonPlans() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/lesson-plans/generic');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching generic lesson plans:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Validate class selection
    if (!selectedClassCode) {
      setError('Please select a class for this lesson plan');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (activeTab === 'scratch') {
        // Create from scratch
        const response = await createLessonPlan({
          name: form.name,
          description: form.description,
          classCode: selectedClassCode,
        });
        
        if (response.success) {
          onSuccess();
          onClose();
          setForm({ name: '', description: '' });
          toast.success("Lesson plan created successfully");
        } else {
          setError(response.error || 'Failed to create lesson plan');
        }
      } else {
        // Create from template
        if (!selectedTemplateId) {
          setError('Please select a template');
          setIsSubmitting(false);
          return;
        }
        
        if (!templateName.trim()) {
          setError('Please provide a name for the lesson plan');
          setIsSubmitting(false);
          return;
        }
        
        const response = await copyGenericLessonPlanToUser(
          selectedTemplateId,
          selectedClassCode,
          templateName // Pass the custom name for the new lesson plan
        );
        
        if (response.success) {
          onSuccess();
          onClose();
          setSelectedTemplateId('');
          setTemplateName('');
          toast.success("Lesson plan created successfully");
        } else {
          setError(response.error || 'Failed to create lesson plan from template');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setForm({ name: '', description: '' });
    setSelectedTemplateId('');
    setTemplateName('');
    // Don't reset selectedClassCode if initialClassCode is provided
    if (!initialClassCode) {
      setSelectedClassCode('');
    }
    setError(null);
  }

  const hasClasses = classes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleReset();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Lesson Plan</DialogTitle>
        </DialogHeader>
        
        {isLoadingClasses ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : !hasClasses ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">You need to create a class before creating a lesson plan.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select 
                value={selectedClassCode} 
                onValueChange={setSelectedClassCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.code} value={classItem.code}>
                      <span className="mr-2">{classItem.emoji}</span>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'scratch' | 'template')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scratch">Create New</TabsTrigger>
                <TabsTrigger value="template">Use Template</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <TabsContent value="scratch">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Lesson Plan Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of this lesson plan"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="template">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template">Select Template</Label>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No templates available
                        </div>
                      ) : (
                        <Select 
                          value={selectedTemplateId} 
                          onValueChange={setSelectedTemplateId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    {selectedTemplateId && (
                      <>
                        {/* New name field for template-based lesson plans */}
                        <div className="space-y-2">
                          <Label htmlFor="templateName">Lesson Plan Name</Label>
                          <Input
                            id="templateName"
                            placeholder="Enter name for your new lesson plan"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            required
                          />
                          <p className="text-xs text-gray-500">
                            You can customize the name of your new lesson plan
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                          <p className="font-medium">Template details:</p>
                          <p className="mt-1">{templates.find(t => t.id === selectedTemplateId)?.description || 'No description available.'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
                
                {error && (
                  <div className="px-2 py-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      isSubmitting || 
                      !selectedClassCode || 
                      (activeTab === 'template' && (!selectedTemplateId || !templateName.trim())) ||
                      (activeTab === 'scratch' && !form.name.trim())
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Plan'
                    )}
                  </Button>
                </div>
              </form>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}