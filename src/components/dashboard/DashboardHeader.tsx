import React from "react";
import UserDropdown from "./UserDropdown";
import { Menu } from "lucide-react";

interface DashboardHeaderProps {
  pageTitle: string;
  teacherImage: string;
  teacherInitial: string;
  teacherName: string;
  onLogout: () => void;
  onMobileMenuToggle: () => void;
  profileVersion?: number;
}

export default function DashboardHeader({
  pageTitle,
  teacherImage,
  teacherInitial,
  teacherName,
  onLogout,
  onMobileMenuToggle,
  profileVersion = 0
}: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
      {/* Left side - Title and mobile menu button */}
      <div className="flex items-center gap-3">
        {/* Mobile/Tablet Menu Button - Hide on lg screens and above (iPad Pro+) */}
        <button
          onClick={onMobileMenuToggle}
          className="p-1.5 rounded-md hover:bg-gray-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
      </div>
      
      {/* Right side - Notifications and user dropdown */}
      <div className="flex items-center gap-3">
        <UserDropdown
          teacherImage={teacherImage}
          teacherInitial={teacherInitial}
          teacherName={teacherName}
          onLogout={onLogout}
          profileVersion={profileVersion}
        />
      </div>
    </header>
  );
}