import { Button } from '@/src/components/ui/button';

interface AssignmentRecord {
    id: string;
    name: string;
    fileType?: string;
    activityType?: string;
    createdAt?: string;
    dueDate?: string;
    size?: string | number;
  }

export default function AssignmentTable({ assignments }: { assignments: AssignmentRecord[] }) {
    return (
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">File Type</th>
            <th className="p-2">Activity</th>
            <th className="p-2">Created</th>
            <th className="p-2">Due Date</th>
            <th className="p-2">Size</th>
            <th className="p-2">Assign</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id}>
              <td className="p-2">{a.name}</td>
              <td className="p-2">{a.fileType || 'N/A'}</td>
              <td className="p-2">{a.activityType || 'N/A'}</td>
              <td className="p-2">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'}</td>
              <td className="p-2">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}</td>
              <td className="p-2">{a.size || 'N/A'}</td>
              <td className="p-2">
                <Button variant="secondary" size="sm">Assign</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  