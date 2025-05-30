'use client';

import { Button } from '@/src/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/src/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/src/components/ui/alert-dialog';
import { deleteFile } from '@/src/app/actions/fileActions';
import { useState } from 'react';
import { MoreHorizontal, FileEdit, Trash2, Send } from 'lucide-react';
import EditFileDialog from './EditFileDialog';
import AssignFileDialog from './AssignFileDialog';
import Link from 'next/link';

interface FileRecord {
  id: string;
  name: string;
  fileType?: string;
  activity?: string;
  createdAt?: string;
  size?: string | number;
  url?: string;
  classId: string;
}

const formatFileSize = (bytes?: number | string): string => {
  if (!bytes) return 'N/A';
  
  const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  
  if (numBytes < 1024 * 1024) {
    return `${(numBytes / 1024).toFixed(1)} KB`;
  }
  return `${(numBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Extract simplified file type from the file type or name
const getSimpleFileType = (fileType?: string, fileName?: string): string => {
  if (fileType) {
    // Remove any prefix like "application/" or "text/"
    const parts = fileType.split('/');
    const ext = parts[parts.length - 1];
    
    // Further simplify common extensions
    if (ext.includes('pdf')) return 'PDF';
    if (ext.includes('word') || ext.includes('doc')) return 'DOC';
    if (ext.includes('excel') || ext.includes('sheet') || ext.includes('csv')) return 'XLS';
    if (ext.includes('powerpoint') || ext.includes('presentation') || ext.includes('ppt')) return 'PPT';
    if (ext.includes('image') || ext.includes('jpeg') || ext.includes('png')) return 'IMG';
    if (ext.includes('video')) return 'VID';
    if (ext.includes('audio')) return 'AUD';
    if (ext.includes('zip') || ext.includes('rar') || ext.includes('tar')) return 'ZIP';
    return ext.toUpperCase().substring(0, 3);
  }
  
  // Try to extract from filename if fileType isn't available
  if (fileName) {
    const nameParts = fileName.split('.');
    if (nameParts.length > 1) {
      const ext = nameParts[nameParts.length - 1].toLowerCase();
      return ext.substring(0, 3).toUpperCase();
    }
  }
  
  return 'FILE';
};

export default function FileTable({ 
  files, 
  onUpdate 
}: { 
  files: FileRecord[],
  onUpdate?: () => void
}) {
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [fileToEdit, setFileToEdit] = useState<FileRecord | null>(null);
  const [fileToAssign, setFileToAssign] = useState<FileRecord | null>(null);

  const handleDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      const result = await deleteFile(fileToDelete);
      if (result.success) {
        onUpdate?.();
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    } finally {
      setFileToDelete(null);
    }
  };

  return (
    <>
      <div className="w-full rounded-lg overflow-hidden">
        {/* Header - Updated with evenly spaced columns */}
        <div className="bg-gray-100 text-gray-800 p-4 grid grid-cols-4 font-medium">
          <div className="col-span-1">Name</div>
          <div className="col-span-1">Activity</div>
          <div className="col-span-1">Created</div>
          <div className="col-span-1 flex justify-between">
            <span>Size</span>
            <span>Actions</span>
          </div>
        </div>
        
        {/* File Rows - Updated to match header */}
        {files.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No files uploaded yet
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="border-b hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-4 p-4 items-center">
                <div className="col-span-1">
                  {file.url ? (
                    <Link 
                      href={file.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {file.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{file.name}</span>
                  )}
                  <div className="text-xs text-gray-500">
                    {getSimpleFileType(file.fileType, file.name)}
                  </div>
                </div>
                <div className="col-span-1">{file.activity || 'N/A'}</div>
                <div className="col-span-1">{formatDate(file.createdAt)}</div>
                <div className="col-span-1 flex justify-between items-center">
                  <div className="bg-blue-100 px-2 py-1 rounded-full text-blue-700 text-xs inline-flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                    {typeof file.size === 'number' ? formatFileSize(file.size) : formatFileSize(file.size) || 'N/A'}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setFileToEdit(file)}>
                        <FileEdit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFileToDelete(file.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFileToAssign(file)}>
                        <Send className="mr-2 h-4 w-4" />
                        Assign to Class
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(isOpen) => !isOpen && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit File Dialog */}
      {fileToEdit && (
        <EditFileDialog
          file={fileToEdit}
          isOpen={!!fileToEdit}
          onClose={() => setFileToEdit(null)}
          onUpdate={() => {
            onUpdate?.();
            setFileToEdit(null);
          }}
        />
      )}

      {/* Assign File Dialog */}
      {fileToAssign && (
        <AssignFileDialog
          file={fileToAssign}
          isOpen={!!fileToAssign}
          onClose={() => setFileToAssign(null)}
          onUpdate={() => {
            onUpdate?.();
            setFileToAssign(null);
          }}
        />
      )}
    </>
  );
}