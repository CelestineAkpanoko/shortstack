import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { createFile } from '@/src/app/actions/fileActions';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { uploadFile } from '@/src/lib/fileUploader';
import { Loader2 } from 'lucide-react';

interface FileRecord {
  id: string;
  name: string;
  fileType?: string;
  activity?: string; // Changed from activityType to match schema
  createdAt?: string;
  size?: string | number;
}

export default function UploadFileDialog({
  lessonPlanId,
  onFileUploaded,
}: {
  lessonPlanId: string;
  onFileUploaded: (file: FileRecord) => void;
}) {
  // Get classId from URL params
  const params = useParams();
  const classId = params.classId as string;
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [activity, setActivity] = useState('interactive');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file || !name) {
      setError('Please provide a file name and select a file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload file to Google Drive
      const uploadResult = await uploadFile(file, name);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'File upload failed');
      }
      
      // 2. Create file record in database with the returned URL
      const res = await createFile({
        name,
        fileType: file.type || 'unknown',
        activity,
        size: file.size,
        url: uploadResult.fileUrl || '',
        classId,
        lessonPlanIds: [lessonPlanId],
      });

      if (res.success) {
        onFileUploaded(res.data);
        setOpen(false);
        setName('');
        setActivity('interactive');
        setFile(null);
      } else {
        setError(res.error || 'Failed to create file record');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isUploading) {
        setOpen(isOpen);
        if (!isOpen) {
          setError(null);
        }
      }
    }}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 text-white" size="sm">Upload</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input 
            placeholder="File Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            disabled={isUploading}
          />
          <select 
            className="border p-2 w-full rounded" 
            value={activity} 
            onChange={(e) => setActivity(e.target.value)}
            disabled={isUploading}
          >
            <option value="interactive">Interactive</option>
            <option value="presentation">Presentation</option>
          </select>
          <Input 
            type="file" 
            accept=".pdf,.ppt,.pptx,.doc,.docx" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            disabled={isUploading}
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={isUploading}
              className="min-w-[80px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}