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
import { formatFileSize } from '@/src/lib/utils';

interface FileRecord {
  id: string;
  name: string;
  fileType?: string;
  activity?: string;
  createdAt?: string;
  size?: string | number;
  url?: string;
  classId: string; // Added the missing property
}

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
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">File Type</th>
            <th className="p-2">Activity</th>
            <th className="p-2">Created</th>
            <th className="p-2">Size</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No files uploaded yet
              </td>
            </tr>
          ) : (
            files.map((file) => (
              <tr key={file.id} className="border-t">
                <td className="p-2">
                  {file.url ? (
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {file.name}
                    </a>
                  ) : (
                    file.name
                  )}
                </td>
                <td className="p-2">{file.fileType || 'N/A'}</td>
                <td className="p-2">{file.activity || 'N/A'}</td>
                <td className="p-2">{file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td className="p-2">{typeof file.size === 'number' ? formatFileSize(file.size) : file.size || 'N/A'}</td>
                <td className="p-2 text-right">
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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