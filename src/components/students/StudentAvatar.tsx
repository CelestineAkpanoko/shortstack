"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

// Extend the session user type to include firstName and lastName
declare module "next-auth" {
  interface User {
    firstName?: string;
    lastName?: string;
  }

  interface Session {
    user?: User;
  }
}
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown 
} from "lucide-react";
import { useRouter } from "next/navigation";

export function StudentAvatar() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Get user initials for the avatar fallback
  const getInitials = () => {
    if (!session?.user) return "ST";
    
    const firstName = session.user.firstName || "";
    const lastName = session.user.lastName || "";
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100 focus:outline-none">
        <Avatar className="h-8 w-8 border">
          <AvatarImage
            src={session?.user?.image || ""}
            alt={session?.user?.name || "Student"}
          />
          <AvatarFallback className="text-xs bg-green-100 text-green-800">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center text-sm">
          <span className="mr-1 hidden md:inline-block">
            {session?.user?.firstName || "Student"}
          </span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {session?.user?.name || "Student"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => router.push('/student/dashboard/profile')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => router.push('/student/dashboard/profile/settings')}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Account Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/student' })}
          className="text-red-600 cursor-pointer focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}