'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { createLessonPlan } from '@/src/app/actions/lessonPlansActions';

interface AddLessonPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
  onSuccess: () => void;
}

export default function AddLessonPlanDialog({
  isOpen,
  onClose,
  classCode,
  onSuccess,
}: AddLessonPlanDialogProps) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const response = await createLessonPlan({
      name: form.name,
      description: form.description,
      classCode,
    });
    if (response.success) {
      onSuccess();
      onClose();
      setForm({ name: '', description: '' });
      setError(null);
    } else {
      setError(response.error || 'Failed to create lesson plan');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Lesson Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="border p-2 w-full"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border p-2 w-full"
          />
          {error && <p className="text-red-600">{error}</p>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
