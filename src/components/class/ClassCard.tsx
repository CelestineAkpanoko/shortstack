'use client'
import React, { useState } from "react";
import { Card } from "@/src/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Users, Calendar, GraduationCap } from "lucide-react";
import { EditClassForm } from "./EditClassForm";
import { deleteClass } from "@/src/app/actions/classActions"
import { useRouter } from "next/navigation";
   
interface ClassCardProps {
  id: string;
  emoji: string;
  name: string;
  code: string;
  color?: string;
  grade?: string;
  numberOfStudents?: number;
  schedule?: string | null;
  overview?: string;
}

export const ClassCard = ({ 
  id, 
  emoji, 
  name, 
  code, 
  color = "primary", 
  grade,
  numberOfStudents,
  schedule,
  overview,
}: ClassCardProps) => {
  const router = useRouter();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  // Get background color directly using a simple mapping function
  const getBackgroundColor = () => {
    switch(color) {
      case "primary": return "bg-blue-500";
      case "secondary": return "bg-purple-500";
      case "destructive": return "bg-red-500";
      case "success": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "default": return "bg-gray-400";
      default: return "bg-blue-500";
    }
  };

  // Get text color directly - most are white except yellow and gray
  const getTextColor = () => {
    return color === "warning" || color === "default" ? "text-gray-900" : "text-white";
  };

  const bgClass = getBackgroundColor();
  const textClass = getTextColor();
  
  // When clicking the card (excluding the dropdown), push to the class detail route.
  const handleCardClick = (e: React.MouseEvent) => {
    // Stop propagation if clicking dropdown or dialog
    if (
      (e.target as HTMLElement).closest('.dropdown-menu') ||
      (e.target as HTMLElement).closest('[role="dialog"]')
    ) {
      e.stopPropagation();
      return;
    }
    router.push(`/teacher/dashboard/classes/${code}`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this class?')) {
      await deleteClass(id);
    }
  }
  
  return (
    <Card className="bg-transparent w-[250px] mx-auto h-[250px] rounded-xl relative overflow-hidden">
      {/* Use an inner container that has the dynamic background */}
      <div
        onClick={handleCardClick} 
        className={`${bgClass} w-full h-full rounded-xl flex flex-col p-4 cursor-pointer`}
      >
        {/* Dropdown menu */}
        <div className="absolute top-2 right-2 dropdown-menu z-10" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreHorizontal className="h-5 w-5 text-white/70 hover:text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsUpdateDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Update
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Header section */}
        <div className="flex flex-col items-center mb-2">
          <div className="text-4xl mb-2">{emoji}</div>
          <h3 className={`text-xl font-semibold ${textClass} text-center`}>{name}</h3>
          <p className={`text-sm ${textClass} opacity-90 text-center`}>Code: {code}</p>
        </div>
        
        {/* Info section - moved to bottom with flex-grow to push it down */}
        <div className="flex flex-col mt-auto space-y-1.5">
          {numberOfStudents !== undefined && (
            <div className={`flex items-center gap-2 ${textClass} opacity-80`}>
              <Users className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{numberOfStudents} students</p>
            </div>
          )}
          
          {schedule && (
            <div className={`flex items-center gap-2 ${textClass} opacity-80`}>
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <p className="text-xs line-clamp-2">{schedule}</p>
            </div>
          )}
          
          {grade && (
            <div className={`flex items-center gap-2 ${textClass} opacity-80`}>
              <GraduationCap className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">Grade: {grade}</p>
            </div>
          )}
        </div>
      </div>

      {/* Only render the edit form when it's open */}
        {isUpdateDialogOpen && (
          <EditClassForm
            isOpen={isUpdateDialogOpen}
            onClose={() => setIsUpdateDialogOpen(false)}
            classData={{
          id,
          name,
          emoji,
          color,
          grade,
          classSessions: schedule ? [{ schedule }] : [], // Use schedule if available
          }}
        />
      )}
    </Card>
  );
};