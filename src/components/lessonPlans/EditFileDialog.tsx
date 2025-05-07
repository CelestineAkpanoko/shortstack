'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useState } from 'react';
import { updateFile } from '@/src/app/actions/fileActions';
import { Loader2 } from 'lucide-react';

interface FileRecord {
  id: string;
  name: string;
  fileType?: string;
  activity?: string;
  size?: number | string;
  url?: string;
  classId: string;
}

interface EditFileDialogProps {
  file: FileRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditFileDialog({ file, isOpen, onClose, onUpdate }: EditFileDialogProps) {
  const [name, setName] = useState(file.name);
  const [activity, setActivity] = useState(file.activity || 'interactive');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name) {
      setError('Please provide a file name');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const res = await updateFile(file.id, {
        name,
        fileType: file.fileType || 'unknown',
        activity,
        size: typeof file.size === 'number' ? file.size : 0,
        url: file.url || '',
        classId: file.classId,
      });

      if (res.success) {
        onUpdate();
      } else {
        setError(res.error || 'Failed to update file');
      }
    } catch (error: any) {
      console.error('Error updating file:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input 
            placeholder="File Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            disabled={isUpdating}
          />
          <select 
            className="border p-2 w-full rounded" 
            value={activity} 
            onChange={(e) => setActivity(e.target.value)}
            disabled={isUpdating}
          >
            <option value="interactive">Interactive</option>
            <option value="presentation">Presentation</option>
          </select>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={isUpdating}
              className="min-w-[80px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating
                </>
              ) : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}