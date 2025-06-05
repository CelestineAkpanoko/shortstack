import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/src/components/ui/dropdown-menu";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

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
  // State to track image loading errors
  const [imageError, setImageError] = useState(false);
  // State to ensure we're using the latest image URL - matching StudentUserDropdown's type definition
  const [imageUrl, setImageUrl] = useState<string | null | undefined>(teacherImage);
  
  // Generate proper initials from the teacher's name
  const properInitials = useMemo(() => {
    if (!teacherName) return teacherInitial || "?";
    
    const nameParts = teacherName.split(" ").filter(part => part.length > 0);
    if (nameParts.length === 0) return "?";
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    // Get first letter of first name and first letter of last name
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }, [teacherName, teacherInitial]);
  
  // Update image URL when prop changes - simplified like StudentUserDropdown
  useEffect(() => {
    console.log("Teacher image prop received:", teacherImage);
    setImageUrl(teacherImage);
    setImageError(false);
  }, [teacherImage]);

  // Handle image load error with enhanced debugging
  const handleImageError = () => {
    console.error("Image load error for URL:", imageUrl);
    console.error("Original teacher image prop:", teacherImage);
    setImageError(true);
  };

  // Fetch latest image from database
  useEffect(() => {
    const fetchLatestTeacherImage = async () => {
      try {
        // Add a timestamp to prevent caching
        const response = await fetch('/api/teacher/profile?t=' + Date.now(), {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.image) {
            console.log("Retrieved fresh image from API:", data.image);
            setImageUrl(data.image);
            setImageError(false);
          }
        }
      } catch (error) {
        console.error("Error fetching latest teacher image:", error);
      }
    };
    
    fetchLatestTeacherImage();
  }, []);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <Avatar className="h-8 w-8 border">
            {imageUrl && !imageError ? (
              <AvatarImage 
                src={imageUrl} 
                alt={teacherName || "User avatar"}
                onError={handleImageError}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {properInitials}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm hidden sm:inline text-gray-800">{teacherName}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 p-1" align="end">
        <div className="px-3 py-2 text-sm">
          <p className="font-medium">Signed in as</p>
          <p className="text-gray-500 truncate">{teacherName}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/teacher/dashboard/settings/account" className="flex items-center gap-2 cursor-pointer w-full">
            <User className="h-4 w-4" />
            <span>My Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/teacher/dashboard/settings/account?tab=security" className="flex items-center gap-2 cursor-pointer w-full">
            <Settings className="h-4 w-4" />
            <span>Security</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 cursor-pointer" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
