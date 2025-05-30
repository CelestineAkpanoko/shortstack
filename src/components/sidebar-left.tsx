"use client"

import * as React from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { NavMain } from "@/src/components/nav-main"
import { NavLogo } from "@/src/components/nav-logo"
import { dashboardData } from "@/src/lib/constants/nav-data"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/src/components/ui/sidebar"

interface SidebarLeftProps {
  filteredNavItems?: any[]; // Add optional prop for filtered items
}

export function SidebarLeft({ filteredNavItems }: SidebarLeftProps = {}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/teacher');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  // Use filtered items if provided, otherwise use default
  const navItems = filteredNavItems || dashboardData.navMain;

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-[#f1faf3]">
      <SidebarHeader className="items-center mb-4">
        <NavLogo items={dashboardData.dashLogo} />
      </SidebarHeader>
      <SidebarContent className="pl-4 pt-10 mb-4 flex flex-col">
        <div className="space-y-6">
          <NavMain items={navItems} /> {/* Use filtered items */}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarTrigger />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
