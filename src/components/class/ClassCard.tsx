'use client'
import React, { useState } from "react";
import { Card } from "@/src/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EditClassForm } from "./EditClassForm";
import { deleteClass } from "@/src/app/actions/classActions"
import { useRouter } from "next/navigation";
   
interface ClassCardProps {
  id: string;
  emoji: string;
  name: string;
  code: string;
  backgroundColor: string;
  cadence?: string;
  day?: string;
  time?: string;
  grade?: string;
  numberOfStudents?: number;
}

export const ClassCard = ({ id, emoji, name, code, backgroundColor, ...props }: ClassCardProps) => {
const router = useRouter();
const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);


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
  // TITO: please style this
if (confirm('Are you sure you want to delete this class?')) {
await deleteClass(id)
}
}
return (
  <Card className="bg-transparent w-[250px] h-[250px] rounded-xl relative">
    {/* Use an inner container that has the dynamic background */}
    <div
        onClick={handleCardClick} 
        className={`${backgroundColor} w-full h-full rounded-xl flex flex-col justify-center items-center cursor-pointer`}>
      <div className="absolute top-2 right-2 dropdown-menu" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreHorizontal className="h-5 w-5 text-gray-500 hover:text-gray-700" />
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

      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-white">{name}</h3>
      <p className="text-md text-white mt-1">Code: {code}</p>
      {props.numberOfStudents && (
        <p className="text-sm text-muted-foreground mt-1">
          Capacity: {props.numberOfStudents} students
        </p>
      )}
    </div>

    <div onClick={e => e.stopPropagation()}>
        <EditClassForm
          isOpen={isUpdateDialogOpen}
          onClose={() => setIsUpdateDialogOpen(false)}
          classData={{
            id,
            name,
            emoji,
            ...props
          }}
        />
      </div>
  </Card>
);
};