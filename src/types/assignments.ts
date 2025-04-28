export interface AssignmentRecord {
  id: string;
  name: string;
  fileType?: string;
  activity?: string;
  dueDate?: string;
  createdAt?: string; // Add this property
  size?: number;
  url?: string;
  classId: string; // Make this required
}