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
import { MoreHorizontal, FileEdit, Trash2, Send, Calendar, FileIcon } from 'lucide-react';
import EditFileDialog from './EditFileDialog';
import AssignFileDialog from './AssignFileDialog';
import Link from 'next/link';
import { getSimpleFileType } from '@/src/lib/utils';

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
      {/* Desktop View */}
      <div className="hidden sm:block w-full rounded-lg overflow-hidden">
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
        
        {/* File Rows - Desktop */}
        {files.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No files uploaded yet
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="border-b hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-4 p-4 items-center">
                <div className="col-span-1 min-w-0">
                  {file.url ? (
                    <Link 
                      href={file.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
                      title={file.name}
                    >
                      {file.name}
                    </Link>
                  ) : (
                    <span className="font-medium truncate block" title={file.name}>
                      {file.name}
                    </span>
                  )}
                  <div className="text-xs text-gray-500">
                    {getSimpleFileType(file.fileType, file.name)}
                  </div>
                </div>
                <div className="col-span-1 truncate" title={file.activity}>{file.activity || 'N/A'}</div>
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

      {/* Mobile View */}
      <div className="sm:hidden w-full">
        {files.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No files uploaded yet
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1 pr-2">
                    {file.url ? (
                      <Link 
                        href={file.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline break-words"
                      >
                        {file.name}
                      </Link>
                    ) : (
                      <h3 className="font-medium break-words">{file.name}</h3>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
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
                        Assign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <div className="flex items-center">
                    <FileIcon className="h-3 w-3 mr-1" />
                    {getSimpleFileType(file.fileType, file.name)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(file.createdAt)}
                  </div>
                  <div className="bg-blue-100 px-2 py-1 rounded-full text-blue-700 text-xs inline-flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                    {typeof file.size === 'number' ? formatFileSize(file.size) : formatFileSize(file.size) || 'N/A'}
                  </div>
                </div>
                
                {file.activity && (
                  <div className="mt-1 text-sm">
                    <span className="text-gray-500">Activity:</span> {file.activity}
                  </div>
                )}
              </div>
            ))}
          </div>
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