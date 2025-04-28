import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/src/components/ui/dropdown-menu";

interface UserDropdownProps {
  teacherImage: string;
  teacherInitial: string;
  teacherName: string;
  onLogout: () => void;
}

export default function UserDropdown({ 
  teacherImage, 
  teacherInitial, 
  teacherName, 
  onLogout 
}: UserDropdownProps) {
  return (
    <div className="flex items-center gap-4 self-end sm:self-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 shadow-sm border border-gray-200">
            <Avatar className="h-8 w-8">
              <AvatarImage src={teacherImage || ""} />
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {teacherInitial}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium hidden sm:inline text-gray-800">{teacherName}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 mt-2 rounded-lg shadow-lg border border-gray-200 bg-white">
          <DropdownMenuItem className="hover:bg-gray-100 text-gray-700 px-4 py-2 cursor-pointer" onClick={() => console.log("Account")}>Account</DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-gray-100 text-gray-700 px-4 py-2 cursor-pointer" onClick={() => console.log("Settings")}>Settings</DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-red-50 text-red-600 px-4 py-2 cursor-pointer" onClick={onLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
