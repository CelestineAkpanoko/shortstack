"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "@/src/hooks/use-toast";
import { Upload, FileText, LinkIcon, Loader2 } from "lucide-react";
import { submitAssignment } from "@/src/app/actions/assignmentActions";
import { useRouter } from "next/navigation";

interface AssignmentSubmitDialogProps {
  children: React.ReactNode;
  assignment: any;
}

const AssignmentSubmitDialog = ({ children, assignment }: AssignmentSubmitDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("computer-upload");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [textEntry, setTextEntry] = useState("");
  const [uploadProgress, setUploadProgress] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Reset form when closing the dialog
    if (!open) {
      setSelectedFile(null);
      setComment("");
      setTextEntry("");
      setGoogleDocUrl("");
      setCurrentTab("computer-upload");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('assignmentId', assignment.id);
      
      let fileUrl = '';
      
      if (currentTab === 'computer-upload' && selectedFile) {
        // First upload the file to Google Drive
        setUploadProgress(true);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('fileName', selectedFile.name);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'File upload failed');
        }
        
        const uploadResult = await uploadResponse.json();
        setUploadProgress(false);
        
        if (uploadResult.success) {
          fileUrl = uploadResult.fileUrl;
          formData.append('fileUrl', fileUrl);
          formData.append('fileName', selectedFile.name);
          formData.append('fileType', selectedFile.type);
          formData.append('fileSize', selectedFile.size.toString());
        } else {
          throw new Error('File upload failed');
        }
      } else if (currentTab === 'text-entry') {
        formData.append('textContent', textEntry);
      } else if (currentTab === 'google-file') {
        formData.append('googleDocUrl', googleDocUrl);
        fileUrl = googleDocUrl;
      }
      
      formData.append('comments', comment);
      if (fileUrl) {
        formData.append('fileUrl', fileUrl);
      }
      
      // Call the server action to submit the assignment
      const response = await submitAssignment(formData);
      
      if (response.success) {
        toast({
          title: "Assignment submitted",
          description: "Your assignment has been uploaded successfully.",
        });
        
        setIsOpen(false);
        setSelectedFile(null);
        setComment("");
        setTextEntry("");
        setGoogleDocUrl("");
        
        // Refresh the page to show the new submission
        router.refresh();
      } else {
        throw new Error(response.error || "Failed to submit assignment");
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "There was an error submitting your assignment. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || 
    (currentTab === "computer-upload" && !selectedFile) ||
    (currentTab === "text-entry" && !textEntry) ||
    (currentTab === "google-file" && !googleDocUrl);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <h3 className="font-medium text-lg">{assignment.name}</h3>
            {assignment.activity && (
              <p className="text-sm text-muted-foreground mt-1">{assignment.activity}</p>
            )}
            {assignment.dueDate && (
              <p className="text-sm mt-2 flex items-center gap-1.5">
                <span className="font-medium">Due:</span> {new Date(assignment.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <Tabs defaultValue="computer-upload" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="computer-upload">Computer Upload</TabsTrigger>
              <TabsTrigger value="text-entry">Text Entry</TabsTrigger>
              <TabsTrigger value="google-file">Google File</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit}>
              <TabsContent value="computer-upload">
                <div 
                  className="border rounded-lg p-6 flex flex-col items-center justify-center text-center"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {!selectedFile ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Drag or Click to upload</p>
                      <label className="cursor-pointer">
                        <Input 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                        <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                          Browse
                        </div>
                      </label>
                    </>
                  ) : (
                    <div className="w-full">
                      <div className="flex items-center gap-3 p-2 border rounded-md bg-muted/50">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedFile(null)}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="text-entry">
                <Textarea 
                  placeholder="Type your assignment response here..."
                  className="min-h-[200px]"
                  value={textEntry}
                  onChange={(e) => setTextEntry(e.target.value)}
                />
              </TabsContent>
              
              <TabsContent value="google-file">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Link to Google Document</span>
                  </div>
                  <Input 
                    placeholder="Paste Google Doc URL here" 
                    className="mb-2"
                    value={googleDocUrl}
                    onChange={(e) => setGoogleDocUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure your Google Doc is set to allow access to anyone with the link.
                  </p>
                </div>
              </TabsContent>
              
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Comments (Optional)</p>
                <Textarea 
                  placeholder="Add any comments about your submission..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="h-24"
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitDisabled}
                >
                  {isSubmitting ? (
                    <>
                      {uploadProgress ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                          Submitting...
                        </>
                      )}
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentSubmitDialog;